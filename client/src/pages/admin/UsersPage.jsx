import { useState } from 'react';
import { KeyRound, Loader2, Mail, Plus } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import FieldInput from '../../components/admin/FieldInput.jsx';
import Modal from '../../components/admin/Modal.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import Button from '../../components/public/Button.jsx';
import { Field, FormMessage } from '../../components/public/FormField.jsx';
import { ErrorState, LoadingState } from '../../components/public/States.jsx';
import { ROLE_LABELS, useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { createUser, listAdminDoctors, listUsers, sendResetLink, setUserPassword, updateUser } from '../../services/adminService.js';
import { serverFieldErrors } from '../../utils/crm.js';
import { formatDateTime } from '../../utils/format.js';

const ROLE_HINTS = {
  super_admin: 'Can do everything, including website content, settings and users.',
  receptionist: 'Manages appointments, patients, leads and follow-ups.',
  doctor: 'Sees only their own appointments and patients.',
};
const roleOptions = ['receptionist', 'doctor', 'super_admin'].map((role) => [role, ROLE_LABELS[role]]);

/** Doctors that can still be given a login (plus the one this person already has, when editing). */
function useDoctorChoices(users, current) {
  const doctors = useFetch((signal) => listAdminDoctors(signal), []);
  const taken = new Set((users || []).map((user) => user.doctor?.id).filter((id) => id && id !== current?.doctor?.id));
  return { loading: doctors.loading, choices: (doctors.data?.items || []).filter((doctor) => !taken.has(doctor.id)) };
}

function UserFormModal({ existing, users, onClose, onSaved }) {
  const toast = useToast();
  const { user: me } = useAuth();
  const isSelf = existing?.id === me.id;
  const [values, setValues] = useState({
    name: existing?.name || '',
    email: existing?.email || '',
    role: existing?.role || 'receptionist',
    doctorId: existing?.doctor ? String(existing.doctor.id) : '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const doctors = useDoctorChoices(users, existing);
  const change = (name, value) => setValues((current) => ({ ...current, [name]: value }));

  const submit = async (event) => {
    event.preventDefault();
    const missing = {};
    if (!values.name.trim()) missing.name = 'Enter the name';
    if (!values.email.trim()) missing.email = 'Enter the email address';
    if (!existing && !values.password) missing.password = 'Choose a password';
    if (values.role === 'doctor' && !values.doctorId) missing.doctorId = 'Choose a doctor';
    setErrors(missing);
    if (Object.keys(missing).length) {
      setFormError('Please fill in the highlighted fields.');
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const body = { name: values.name, email: values.email, role: values.role, doctorId: values.role === 'doctor' ? values.doctorId : existing ? '' : undefined };
      if (existing) await updateUser(existing.id, body);
      else await createUser({ ...body, password: values.password });
      toast.success(existing ? 'Login updated.' : 'Login created.');
      onSaved();
      onClose();
    } catch (error) {
      const { fields, message } = serverFieldErrors(error, []);
      setErrors(fields);
      setFormError(message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={existing ? 'Edit login' : 'Add a staff login'}
      onClose={onClose}
      dismissible={!busy}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" form="user-form" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Save
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} noValidate className="grid gap-4">
        <FieldInput field={{ name: 'name', label: 'Name', required: true }} value={values.name} error={errors.name} onChange={change} />
        <FieldInput field={{ name: 'email', label: 'Email address', type: 'email', required: true, hint: 'They sign in with this address.' }} value={values.email} error={errors.email} onChange={change} />
        <FieldInput
          field={{ name: 'role', label: 'Role', type: 'select', options: roleOptions, hint: isSelf ? 'You cannot change your own role.' : ROLE_HINTS[values.role] }}
          value={values.role}
          error={errors.role}
          onChange={(name, value) => !isSelf && change(name, value)}
        />
        {values.role === 'doctor' && (
          <FieldInput
            field={{
              name: 'doctorId',
              label: 'Which doctor is this?',
              type: 'select',
              required: true,
              options: [['', doctors.loading ? 'Loading…' : doctors.choices.length ? 'Choose a doctor' : 'Every doctor already has a login'], ...doctors.choices.map((doctor) => [String(doctor.id), doctor.name])],
            }}
            value={values.doctorId}
            error={errors.doctorId}
            onChange={change}
          />
        )}
        {!existing && (
          <FieldInput
            field={{ name: 'password', label: 'Starting password', type: 'password', autoComplete: 'new-password', required: true, hint: 'At least 8 characters with a letter and a number. Share it privately, or email a reset link afterwards so they choose their own.' }}
            value={values.password}
            error={errors.password}
            onChange={change}
          />
        )}
        <FormMessage type="error">{formError}</FormMessage>
      </form>
    </Modal>
  );
}

function PasswordModal({ target, onClose }) {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await setUserPassword(target.id, password);
      toast.success(`New password set for ${target.name}. They are signed out everywhere.`);
      onClose();
    } catch (failure) {
      const { fields, message } = serverFieldErrors(failure, []);
      setError(fields.password || message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Set a new password for ${target.name}`}
      onClose={onClose}
      dismissible={!busy}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" form="password-form" disabled={busy || !password}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Set password
          </Button>
        </>
      }
    >
      <form id="password-form" onSubmit={submit} noValidate className="space-y-4">
        <Field label="New password" required hint="At least 8 characters with a letter and a number. They are signed out on every device.">
          {(props) => <input {...props} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} data-autofocus className="field-input" />}
        </Field>
        <FormMessage type="error">{error}</FormMessage>
      </form>
    </Modal>
  );
}

export default function UsersPage() {
  const toast = useToast();
  const { user: me } = useAuth();
  const { data, loading, error, reload } = useFetch((signal) => listUsers(signal), []);
  const [editing, setEditing] = useState(null); // 'new' | user
  const [passwordFor, setPasswordFor] = useState(null);
  const [pending, setPending] = useState(null); // `${action}-${id}`

  const run = async (key, action, success) => {
    setPending(key);
    try {
      await action();
      toast.success(success);
      reload();
    } catch (failure) {
      toast.error(failure.message);
    } finally {
      setPending(null);
    }
  };

  const actions = (user) => (
    <>
      <Button variant="outline" onClick={() => setEditing(user)} aria-label={`Edit ${user.name}`}>Edit</Button>
      <Button variant="outline" onClick={() => setPasswordFor(user)} aria-label={`Set a new password for ${user.name}`}>
        <KeyRound className="h-4 w-4" aria-hidden="true" />
        Password
      </Button>
      {user.isActive && (
        <Button
          variant="outline"
          disabled={pending === `reset-${user.id}`}
          onClick={() => run(`reset-${user.id}`, () => sendResetLink(user.id), `Reset link emailed to ${user.email}.`)}
          aria-label={`Email a password reset link to ${user.name}`}
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          Email link
        </Button>
      )}
      {user.id !== me.id && (
        <Button
          variant="outline"
          className={user.isActive ? '!border-red-300 !text-red-700 hover:!bg-red-50' : ''}
          disabled={pending === `toggle-${user.id}`}
          onClick={() => run(`toggle-${user.id}`, () => updateUser(user.id, { isActive: !user.isActive }), user.isActive ? `${user.name} can no longer sign in.` : `${user.name} can sign in again.`)}
          aria-label={`${user.isActive ? 'Switch off' : 'Switch on'} ${user.name}`}
        >
          {user.isActive ? 'Switch off' : 'Switch on'}
        </Button>
      )}
    </>
  );

  return (
    <>
      <AdminHeader
        title="Users"
        description="People who can sign in to this dashboard. Switching someone off keeps their history but stops them signing in."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add login
          </Button>
        }
      />
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      <ul className="space-y-3">
        {data?.items.map((user) => (
          <li key={user.id} className="rounded-2xl border border-slate-200 bg-white p-4 lg:flex lg:items-center lg:justify-between lg:gap-6">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
                {user.name}
                {user.id === me.id && <span className="font-normal text-slate-500">(you)</span>}
                <StatusBadge status={user.isActive ? 'confirmed' : 'cancelled'} label={user.isActive ? 'Active' : 'Switched off'} />
              </p>
              <p className="truncate text-sm text-slate-500">{user.email}</p>
              <p className="mt-1 text-xs text-slate-500">
                {ROLE_LABELS[user.role]}{user.doctor && ` · ${user.doctor.name}`} · Last signed in: {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'never'}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 lg:mt-0 lg:shrink-0 lg:justify-end">{actions(user)}</div>
          </li>
        ))}
      </ul>

      {editing && <UserFormModal existing={editing === 'new' ? null : editing} users={data?.items} onClose={() => setEditing(null)} onSaved={reload} />}
      {passwordFor && <PasswordModal target={passwordFor} onClose={() => setPasswordFor(null)} />}
    </>
  );
}
