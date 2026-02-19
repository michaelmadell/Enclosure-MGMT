import React from 'react';
import { confirmable, createConfirmation, type ConfirmDialogProps } from 'react-confirm';

const PowerConfirmDialog = ({ show, proceed, message }: ConfirmDialogProps<{ message: string }, boolean>) => (
  <div className={`dialog-overlay ${show ? 'show' : 'hide'}`}>
    <div className="dialog">
      <p>{message}</p>
      <button onClick={() => proceed(true)}>Yes</button>
      <button onClick={() => proceed(false)}>No</button>
    </div>
  </div>
);

export const PowerConfirm = createConfirmation(confirmable(PowerConfirmDialog));