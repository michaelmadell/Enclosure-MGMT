export interface CmcCredentials {
  username: string;
  password: string;
}

export interface CmcPayload extends CmcCredentials {
  name: string;
  address: string;
  notes?: string;
}

export interface Cmc extends CmcPayload {
  id: string;
  created_at: number | string;
  updated_at: number | string;
}

export interface AuthUser {
  username: string;
  role: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

export interface AddCmcModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: CmcPayload) => Promise<ActionResult>;
}

export interface PowerActionResult {
    success: boolean;
    error?: string;
}

export interface ApiToolsPanelProps {
  cmc: Cmc;
  onActionComplete?: (action: string) => void;
}

export interface CmcSidebarProps {
  cmcs: Cmc[];
  selectedCmc: Cmc | null;
    onSelectCmc: (cmc: Cmc) => void;
    onEditCmc: (cmc: Cmc) => void;
    onDeleteCmc: (cmcId: string) => void;
    isAdmin: boolean;
    readOnly: boolean;
}

export interface CmcViewerProps {
  cmc: Cmc;
}

export interface CmcEvent {
  id?: string;
  message: string;
  timestamp: string;
  username?: string;
  severity?: string;
}

export interface FirmwareEntry {
  version: string;
  packageDate: string;
  installDate: string;
}

export interface EditCmcModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (cmcId: string, data: CmcPayload) => Promise<ActionResult>;
  cmc: Cmc;
}

export interface ConfirmDialogProps<T, R> {
  show: boolean;
  message: T;
  proceed: (result: R) => void;
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<ActionResult>;
  logout: () => void;
  isAdmin: () => boolean;
  isGuest: () => boolean;
  isAuthenticated: boolean;
}