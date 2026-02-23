from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(title="NinjaAPI Mock Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# ── In-memory "database" ────────────────────────────────────────────────────
# ---------------------------------------------------------------------------

_now = datetime.now(timezone.utc)

# Auth token store  {token: username}
_tokens: Dict[str, str] = {"mock-token-admin": "admin"}

# Users
_users: List[Dict] = [
    {
        "id": 1,
        "username": "admin",
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@example.com",
        "lastLogin": _now.isoformat(),
        "dateJoined": "2024-01-01T00:00:00Z",
        "userProfile": {
            "locale": "en-GB",
            "timezone": "Europe/London",
            "role": "admin",
            "isEnabled": True,
            "maxConcurrentLogins": 3,
            "origin": "local",
        },
    },
    {
        "id": 2,
        "username": "operator",
        "firstName": "Op",
        "lastName": "User",
        "email": "op@example.com",
        "lastLogin": None,
        "dateJoined": "2024-06-01T00:00:00Z",
        "userProfile": {
            "locale": "en-GB",
            "timezone": "Europe/London",
            "role": "operator",
            "isEnabled": True,
            "maxConcurrentLogins": 3,
            "origin": "local",
        },
    },
]
_user_id_seq = 3


def _make_event(idx: int, severity: str, message: str, username: str = "admin"):
    return {
        "id": idx,
        "timestamp": _now.isoformat(),
        "severity": severity,
        "message": message,
        "username": username,
    }


_auth_events = [
    _make_event(1, "info", "User admin logged in"),
    _make_event(2, "warning", "Failed login attempt for user guest"),
    _make_event(3, "info", "User operator created"),
]

_interface_events = [
    _make_event(1, "info", "Static IP configured"),
    _make_event(2, "info", "Hostname changed to corestation-01"),
    _make_event(3, "error", "NTP sync failed"),
    _make_event(4, "info", "Static IP configured"),
    _make_event(5, "info", "Hostname changed to corestation-01"),
    _make_event(6, "error", "NTP sync failed"),
    _make_event(7, "info", "Static IP configured"),
    _make_event(8, "info", "Hostname changed to corestation-01"),
    _make_event(9, "error", "NTP sync failed"),
]

_corestation_events = [
    _make_event(1, "info", "Node 1 powered on", "system"),
    _make_event(2, "warning", "Fan 2 speed degraded", "system"),
    _make_event(3, "info", "PSU 1 online", "system"),
]

# Enclosure state
_enclosure = {
    "hardwareVersion": "1.2.0",
    "serialNumber": "CS-0001",
    "firmwareVersion": "3.4.1",
    "hostname": "corestation-01",
    "alias": "Main Enclosure",
    "hostIp": "192.168.1.10",
    "hostMac": "AA:BB:CC:DD:EE:FF",
}

_enclosure_time = {
    "timezone": "UTC",
    "timestamp": _now.isoformat(),
    "ntpServer": "pool.ntp.org",
}

_enclosure_location = {
    "datacenter": "DC-West",
    "room": "Room-A",
    "aisle": "Aisle-3",
    "rack": "Rack-07",
    "rackSlot": "1U",
}

_enclosure_mgmt = {
    **_enclosure,
    "ipAssignment": "static",
    "gateway": "192.168.1.1",
    "netmask": "255.255.255.0",
    "dns": {"primary": "8.8.8.8", "secondary": "8.8.4.4"},
    "fqdn": "corestation-01.example.com",
    "vproEnabled": True,
}

# Nodes (1-12)
_nodes: Dict[int, Dict] = {
    i: {
        "id": i,
        "hostname": f"node-{i:02d}",
        "netIntIpv4": f"192.168.2.{i}",
        "netIntMac": f"00:11:22:33:44:{i:02X}",
        "netIntIpAssignment": "dhcp",
        "netExtIpv4": f"10.0.0.{i}",
        "netExtMac": f"00:AA:BB:CC:DD:{i:02X}",
        "netExtIpAssignment": "dhcp",
        "serialNumber": f"SN{i:04d}",
        "model": "CS-N1",
        "cpu": "Intel Xeon E-2388G",
        "gpu": "NVIDIA T1000",
        "ram0": 16384,
        "ram1": 16384,
        "ssd0": "Samsung 970 EVO 1TB",
        "ssd1": "",
        "os": "Ubuntu 22.04 LTS",
        "appVersion": "3.4.1",
        "nodeName": f"Node-{i}",
        "nodeGroup": "GroupA",
        "nodeRole": "compute",
    }
    for i in range(1, 13)
}

# Fans (1-6)
_fans: Dict[int, Dict] = {
    i: {
        "id": i,
        "moduleSerialNumber": f"FMSN{i:04d}",
        "moduleRevision": "A1",
        "moduleBuildTime": "2023-06-15T10:00:00Z",
        "fanSerialNumber": f"FSN{i:04d}",
        "fanManufacturer": "Delta Electronics",
        "fanModel": "FFB1212EHE",
        "maxSpeed": 12000,
    }
    for i in range(1, 7)
}

# PSUs (1-2)
_psus: Dict[int, Dict] = {
    i: {
        "id": i,
        "serialNumber": f"PSUSN{i:04d}",
        "manufacturer": "Delta Electronics",
        "model": "DPS-800AB-1A",
        "maxPower": 800,
    }
    for i in range(1, 3)
}

# Switch
_switch = {
    "serialNumber": "SW-0001",
    "model": "CS-SW1",
    "lagEnabled": "up",
    "lagSpeed": "10G",
    "firmwareVersion": "2.1.0",
    "hostIp": "192.168.1.11",
    "hostMac": "00:DE:AD:BE:EF:01",
}

# Fan control
_fan_control = {"mode": "auto", "speed": 40}

# LDAP config
_ldap_config = {
    "serverUri": None,
    "isEnabled": False,
    "baseDn": None,
    "bindDn": None,
    "userFilter": None,
    "requireTlsCert": False,
    "startTls": False,
    "usernameAttr": "sAMAccountName",
    "groupBaseDn": None,
    "requiredGroupDn": None,
    "networkTimeout": 10,
    "searchTimeout": 10,
    "isRoleFromGroup": False,
    "defaultRole": "guest",
}

# Scheduled jobs
_scheduled_jobs: Dict[int, Dict] = {}
_job_id_seq = 1

# SSH / Serial / vPro / LAG toggles
_ssh_enabled = False
_serial_enabled = False
_vpro_enabled = True
_lag_enabled = False

# ---------------------------------------------------------------------------
# ── Helpers ─────────────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------


def _paged(items: List[Any], limit: int, offset: int, text_filter=None, severity_filter=None):
    if text_filter:
        items = [e for e in items if text_filter.lower() in e.get("message", "").lower()]
    if severity_filter:
        items = [e for e in items if e.get("severity") == severity_filter]
    return {"items": items[offset: offset + limit], "count": len(items)}


def _find_user(user_id: int):
    for u in _users:
        if u["id"] == user_id:
            return u
    return None


# ---------------------------------------------------------------------------
# ── /api/auth ────────────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------


@app.post("/api/auth/token")
def issue_token(body: dict):
    username = body.get("username")
    password = body.get("password")
    for u in _users:
        if u["username"] == username:
            token = f"mock-token-{username}"
            _tokens[token] = username
            return {"accessToken": token, "username": username}
    raise HTTPException(status_code=401, detail="Invalid credentials")


@app.get("/api/auth/users/")
def get_users():
    return _users


@app.get("/api/auth/user")
def get_user(id: int = Query(default=1)):
    u = _find_user(id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return u


@app.post("/api/auth/users/create")
def create_user(body: dict):
    global _user_id_seq
    new_user = {
        "id": _user_id_seq,
        "username": body["username"],
        "firstName": None,
        "lastName": None,
        "email": body.get("email", ""),
        "lastLogin": None,
        "dateJoined": datetime.now(timezone.utc).isoformat(),
        "userProfile": {
            "locale": "en-GB",
            "timezone": "Europe/London",
            "role": body.get("role", "operator"),
            "isEnabled": True,
            "maxConcurrentLogins": body.get("max_concurrent_logins", 3),
            "origin": "local",
        },
    }
    _users.append(new_user)
    _user_id_seq += 1
    return new_user


@app.patch("/api/auth/token/users/update")
def update_account(body: dict):
    u = _find_user(body["id"])
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    for field in ("firstName", "lastName", "email"):
        snake = {"firstName": "first_name", "lastName": "last_name"}.get(field, field)
        if snake in body:
            u[field] = body[snake]
    if "locale" in body:
        u["userProfile"]["locale"] = body["locale"]
    if "timezone" in body:
        u["userProfile"]["timezone"] = body["timezone"]
    return u


@app.patch("/api/auth/users/edit")
def edit_user(body: dict):
    u = _find_user(body["id"])
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u["userProfile"]["role"] = body["role"]
    u["userProfile"]["isEnabled"] = body["is_enabled"]
    if "max_concurrent_logins" in body:
        u["userProfile"]["maxConcurrentLogins"] = body["max_concurrent_logins"]
    if "email" in body:
        u["email"] = body["email"]
    return u


@app.delete("/api/auth/users/delete/{user_id}")
def delete_user(user_id: int):
    global _users
    before = len(_users)
    _users = [u for u in _users if u["id"] != user_id]
    if len(_users) == before:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": "deleted"}


@app.post("/api/auth/token/users/reset")
def reset_users():
    return {"detail": "Users reset to defaults"}


@app.get("/api/auth/events")
def auth_get_events(
    text_filter: Optional[str] = None,
    severity_filter: Optional[str] = None,
    limit: int = Query(default=100, ge=1),
    offset: int = Query(default=0, ge=0),
):
    return _paged(_auth_events, limit, offset, text_filter, severity_filter)


@app.get("/api/auth/ldap")
def get_ldap():
    return _ldap_config


@app.patch("/api/auth/ldap")
def set_ldap(body: dict):
    _ldap_config.update(
        {
            "serverUri": body.get("server_uri", _ldap_config["serverUri"]),
            "baseDn": body.get("base_dn", _ldap_config["baseDn"]),
            "bindDn": body.get("bind_dn", _ldap_config["bindDn"]),
            "userFilter": body.get("user_filter", _ldap_config["userFilter"]),
            "requireTlsCert": body.get("require_tls_cert", _ldap_config["requireTlsCert"]),
            "startTls": body.get("start_tls", _ldap_config["startTls"]),
            "usernameAttr": body.get("username_attr", _ldap_config["usernameAttr"]),
            "groupBaseDn": body.get("group_base_dn", _ldap_config["groupBaseDn"]),
            "requiredGroupDn": body.get("required_group_dn", _ldap_config["requiredGroupDn"]),
            "networkTimeout": body.get("network_timeout", _ldap_config["networkTimeout"]),
            "searchTimeout": body.get("search_timeout", _ldap_config["searchTimeout"]),
            "isRoleFromGroup": body.get("is_role_from_group", _ldap_config["isRoleFromGroup"]),
            "defaultRole": body.get("default_role", _ldap_config["defaultRole"]),
        }
    )
    return {"detail": "LDAP config updated"}


@app.post("/api/auth/toggle-ldap")
def toggle_ldap():
    _ldap_config["isEnabled"] = not _ldap_config["isEnabled"]
    return {"isEnabled": _ldap_config["isEnabled"]}


@app.get("/api/auth/ldap-cert")
def get_ldap_cert():
    return {"cert": None, "uploaded": False}


@app.delete("/api/auth/ldap-cert")
def delete_ldap_cert():
    return {"detail": "Certificate deleted"}


@app.post("/api/auth/test-ldap-conn")
def test_ldap_connection(body: dict):
    return {"success": True, "message": "Connection successful (mock)"}


# ---------------------------------------------------------------------------
# ── /api/interface ───────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------


@app.get("/api/interface/events")
def interface_get_events(
    text_filter: Optional[str] = None,
    severity_filter: Optional[str] = None,
    limit: int = Query(default=100, ge=1),
    offset: int = Query(default=0, ge=0),
):
    return _paged(_interface_events, limit, offset, text_filter, severity_filter)


@app.post("/api/interface/set-dhcp")
def set_dhcp():
    _enclosure_mgmt["ipAssignment"] = "dhcp"
    return {"detail": "DHCP enabled"}


@app.post("/api/interface/set-static-ip")
def set_static_ip(body: dict):
    _enclosure_mgmt.update(
        {
            "hostIp": body["host_ip"],
            "gateway": body["gateway"],
            "netmask": body["netmask"],
            "dns": {f"dns{i}": v for i, v in enumerate(body["dns"])},
            "ipAssignment": "static",
        }
    )
    return {"detail": "Static IP configured"}


@app.post("/api/interface/set-hostname")
def set_hostname(body: dict):
    _enclosure["hostname"] = body["hostname"]
    _enclosure_mgmt["hostname"] = body["hostname"]
    return {"detail": "Hostname updated"}


@app.post("/api/interface/set-alias")
def set_alias(body: dict):
    _enclosure["alias"] = body["alias"]
    _enclosure_mgmt["alias"] = body["alias"]
    return {"detail": "Alias updated"}


@app.post("/api/interface/start-blink")
def start_blink(body: dict):
    return {"detail": f"Blinking started for {body['component']} id={body['id']} duration={body['duration']}s"}


@app.post("/api/interface/stop-blink")
def stop_blink(body: dict):
    return {"detail": f"Blinking stopped for {body['component']} id={body['id']}"}


@app.post("/api/interface/power-action")
def power_action(body: dict):
    return {
        "detail": f"Power action {body['action']} applied to {body['component']} id={body['id']}"
    }


@app.post("/api/interface/schedule-power-action")
def schedule_power_action(body: dict):
    global _job_id_seq
    job = {
        "id": _job_id_seq,
        "name": f"Power action {body['action']} on {body['component']} {body['id']}",
        "task": "corestation.tasks.power_action",
        "args": [body["id"], body["component"], body["action"]],
        "kwargs": {},
        "crontab": body.get("schedule"),
    }
    _scheduled_jobs[_job_id_seq] = job
    _job_id_seq += 1
    return {"detail": "Scheduled", "job_id": job["id"]}


@app.get("/api/interface/schedule")
def get_schedule(component: str, id: int):
    return [j for j in _scheduled_jobs.values() if id in j.get("args", [])]


@app.delete("/api/interface/schedule")
def delete_scheduled_job(id: int):
    if id not in _scheduled_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    del _scheduled_jobs[id]
    return {"detail": "Job deleted"}


@app.post("/api/interface/fan-speed")
def set_fan_speed(body: dict):
    fan_id = body["id"]
    if fan_id not in _fans:
        raise HTTPException(status_code=404, detail="Fan not found")
    return {"detail": f"Fan {fan_id} set to mode={body['mode']} speed={body.get('speed')}"}


@app.post("/api/interface/toggle-ssh")
def toggle_ssh(body: dict):
    global _ssh_enabled
    _ssh_enabled = body["enabled"]
    return {"sshEnabled": _ssh_enabled}


@app.post("/api/interface/toggle-serial")
def toggle_serial(body: dict):
    global _serial_enabled
    _serial_enabled = body["enabled"]
    return {"serialEnabled": _serial_enabled}


@app.post("/api/interface/node")
def edit_node_info(body: dict):
    node_id = body["id"]
    if node_id not in _nodes:
        raise HTTPException(status_code=404, detail="Node not found")
    if body.get("node_name") is not None:
        _nodes[node_id]["nodeName"] = body["node_name"]
    if body.get("node_group") is not None:
        _nodes[node_id]["nodeGroup"] = body["node_group"]
    if body.get("node_role") is not None:
        _nodes[node_id]["nodeRole"] = body["node_role"]
    return _nodes[node_id]


@app.post("/api/interface/enclosure-time")
def edit_enclosure_time(body: dict):
    _enclosure_time["timezone"] = body["timezone"]
    _enclosure_time["ntpServer"] = body["ntp_server"]
    return {"detail": "Enclosure time updated"}


@app.post("/api/interface/enclosure-location")
def edit_enclosure_location(body: dict):
    for key in ("datacenter", "room", "aisle", "rack", "rack_slot"):
        schema_key = "rackSlot" if key == "rack_slot" else key
        if key in body and body[key] is not None:
            _enclosure_location[schema_key] = body[key]
    return {"detail": "Location updated"}


@app.get("/api/interface/firmware")
def get_firmware_history():
    return {
        "history": [
            {"version": "3.4.1", "date": "2024-03-01T10:00:00Z", "status": "active"},
            {"version": "3.3.0", "date": "2023-12-01T09:00:00Z", "status": "previous"},
        ]
    }


@app.get("/api/interface/cert-info")
def get_cert_info():
    return {
        "subject": "CN=corestation-01.example.com",
        "issuer": "CN=Mock CA",
        "validFrom": "2024-01-01T00:00:00Z",
        "validTo": "2025-01-01T00:00:00Z",
        "selfSigned": True,
    }


@app.get("/api/interface/vpro")
def get_vpro_enabled():
    return {"vproEnabled": _vpro_enabled}


@app.post("/api/interface/toggle-vpro")
def toggle_vpro():
    global _vpro_enabled
    _vpro_enabled = not _vpro_enabled
    return {"vproEnabled": _vpro_enabled}


@app.get("/api/interface/vpro/token")
def get_redirect_token(id: int = Query(default=1)):
    return {"token": f"mock-vpro-redirect-token-node-{id}", "nodeId": id}


@app.post("/api/interface/vpro/features")
def vpro_feature_post(body: dict):
    return {"detail": f"Feature POST sent to vPro node {body['id']}"}


@app.post("/api/interface/vpro/set-edid")
def set_edid(body: dict):
    return {"detail": f"EDID {'enabled' if body['enabled'] else 'disabled'} on node {body['id']}"}


@app.get("/api/interface/lag")
def get_lag():
    return {"lagEnabled": _lag_enabled}


@app.post("/api/interface/toggle-lag")
def toggle_lag(body: dict):
    global _lag_enabled
    _lag_enabled = body["enabled"]
    return {"lagEnabled": _lag_enabled}


# ---------------------------------------------------------------------------
# ── /api/corestation ─────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------


@app.get("/api/corestation/node")
def get_node(id: int = Query(default=1)):
    if id not in _nodes:
        raise HTTPException(status_code=404, detail={})
    return _nodes[id]


@app.get("/api/corestation/nodes")
def get_nodes():
    return list(_nodes.values())


@app.get("/api/corestation/fan")
def get_fan(id: int = Query(default=1)):
    if id not in _fans:
        raise HTTPException(status_code=404, detail="Fan not found")
    return _fans[id]


@app.get("/api/corestation/fans")
def get_fans():
    return list(_fans.values())


@app.get("/api/corestation/psu")
def get_psu(id: int = Query(default=1)):
    if id not in _psus:
        raise HTTPException(status_code=404, detail="PSU not found")
    return _psus[id]


@app.get("/api/corestation/psus")
def get_psus():
    return list(_psus.values())


@app.get("/api/corestation/switch")
def get_switch():
    return _switch


@app.get("/api/corestation/enclosure")
def get_enclosure():
    return _enclosure


@app.get("/api/corestation/enclosure-time")
def get_enclosure_time():
    return _enclosure_time


@app.get("/api/corestation/enclosure-location")
def get_enclosure_location():
    return _enclosure_location


@app.get("/api/corestation/enclosure-management")
def get_enclosure_management():
    return _enclosure_mgmt


@app.get("/api/corestation/state")
def get_state():
    """Full corestation state snapshot."""
    node_states = {
        str(i): {
            "health": "healthy",
            "present": True,
            "enabled": True,
            "blinkLed": False,
            "fwUpdateState": "inactive",
            "isConfiguringBios": False,
            "comPowerState": "on",
            "inletTemp": 38,
            "fault": 0,
            "power": 120,
            "cpuTemp": 52,
            "gpuTemp": 61,
            "sessionUser": "",
            "sessionState": 0,
            "netIntLinkSpeed": "1G",
            "netExtLinkSpeed": "10G",
        }
        for i in range(1, 13)
    }
    fan_states = {
        str(i): {
            "health": "healthy",
            "present": True,
            "fault": 0,
            "speed1": 4500,
            "speed2": 4500,
            "setSpeed": 40,
        }
        for i in range(1, 7)
    }
    psu_states = {
        str(i): {
            "health": "healthy",
            "present": True,
            "outputEnabled": True,
            "fault": 0,
            "acAvailable": True,
            "outputLoad": 45,
            "temperature": 42,
            "ambientTemp": 28,
        }
        for i in range(1, 3)
    }
    sfp_states = {
        str(i): {
            "name": f"SFP{i}",
            "linkStatus": "up",
            "linkSpeed": "10G",
            "serialNumber": f"SFPSN{i:04d}",
        }
        for i in range(1, 3)
    }
    return {
        "enclosure": {
            "1": {
                "health": "healthy",
                "powerState": "on",
                "blinkLed": False,
                "fwUpdateState": "inactive",
                "fwUpdateProgress": 0,
                "fwUploadState": "inactive",
                "fwUploadProgress": 0,
                "fwUploadAborted": False,
                "fwRestartRequired": False,
                "logGenerationState": "inactive",
                "logGenerationProgress": 0,
                "logFilename": "",
                "logExportType": "",
                "httpsCsrAvailable": False,
                "bmcFwBinHash": "",
                "bmcFwBaseJsonHash": "",
                "bmcFwUpdateJsonHash": "",
                "sshEnabled": _ssh_enabled,
                "serialEnabled": _serial_enabled,
                "ready": True,
                "allowEarlyAccess": False,
            }
        },
        "powerSystem": {
            "1": {
                "policy": "N+1",
                "health": "healthy",
                "outputHealth": "healthy",
                "outputDegradedLimit": 85,
                "outputCriticalLimit": 95,
                "outputTotal": 1600,
                "outputPercentage": 22.5,
                "psuHealth": "healthy",
                "psuIssues": [],
                "outputAvailable": 1240,
            }
        },
        "coolingSystem": {
            "1": {
                "health": "healthy",
                "message": "",
                "fanHealth": "healthy",
                "fanIssues": [],
                "speedPercentage": 40.0,
                "speedRpm": 4500,
                "ambientTemp": 28,
            }
        },
        "switchSystem": {
            "1": {
                "health": "healthy",
                "message": "",
                "lagEnabled": _lag_enabled,
                "lagSpeed": "10G",
                "SFPs": {
                    str(i): {
                        "name": f"SFP{i}",
                        "link_status": "up",
                        "link_speed": "10G",
                        "serial_number": f"SFPSN{i:04d}",
                    }
                    for i in range(1, 3)
                },
            }
        },
        "switch": {
            "1": {
                "health": "healthy",
                "powerState": "on",
                "lagEnabled": "up" if _lag_enabled else "down",
                "lagSpeed": "10G",
                "smarcMacAddr": "00:DE:AD:BE:EF:00",
                "swxMacAddr": "00:DE:AD:BE:EF:01",
            }
        },
        "node": node_states,
        "fan": fan_states,
        "psu": psu_states,
        "sfp": sfp_states,
    }


@app.get("/api/corestation/fetch-fan-control")
def fetch_fan_control():
    return _fan_control


@app.post("/api/corestation/set-fan-control")
def set_fan_control(body: dict):
    _fan_control["mode"] = body["mode"]
    _fan_control["speed"] = body["speed"]
    return _fan_control


@app.get("/api/corestation/events")
def corestation_get_events(
    text_filter: Optional[str] = None,
    severity_filter: Optional[str] = None,
    limit: int = Query(default=100, ge=1),
    offset: int = Query(default=0, ge=0),
):
    return _paged(_corestation_events, limit, offset, text_filter, severity_filter)


@app.get("/")
def root():
    index_path = Path(__file__).with_name("index.html")
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="index.html not found")
    return FileResponse(index_path, media_type="text/html")

# ---------------------------------------------------------------------------
# ── Entry point ──────────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="0.0.0.0", port=8080, reload=True)