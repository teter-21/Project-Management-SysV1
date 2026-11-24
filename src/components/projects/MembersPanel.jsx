import { useState } from "react";
import { UserPlus, Trash2 } from "lucide-react";

import {
  addProjectMember,
  removeProjectMember,
  setProjectMemberRole,
} from "../../features/members/memberService";

function MembersPanel({ projectId, members, isOwner, onChanged }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleAdd(event) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await addProjectMember(projectId, email, role);
      await onChanged();

      setEmail("");
      setRole("member");
      setMessage("Member added successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleChangeRole(userId, newRole) {
    if (busy) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await setProjectMemberRole(projectId, userId, newRole);

      await onChanged();
      setMessage("Member role updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(member) {
    if (busy) return;

    const confirmed = window.confirm(
      `Remove ${member.profile?.full_name || "this member"} from this project?`,
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await removeProjectMember(projectId, member.user_id);

      await onChanged();
      setMessage("Member removed.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="members-panel">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="form-success" role="status">
          {message}
        </p>
      )}

      <div className="members-list">
        {members.map((member) => {
          const name = member.profile?.full_name || "Unknown User";

          const initials = name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() || "")
            .join("");

          return (
            <div className="member-row" key={member.user_id}>
              <div className="member-identity">
                <div className="member-avatar">{initials}</div>

                <div className="member-details">
                  <strong>{name}</strong>
                  <span>{member.role}</span>
                </div>
              </div>

              {isOwner && member.role !== "owner" && (
                <div className="member-actions">
                  <select
                    aria-label={`Role for ${name}`}
                    value={member.role}
                    disabled={busy}
                    onChange={(event) =>
                      handleChangeRole(member.user_id, event.target.value)
                    }
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button
                    className="icon-button member-remove"
                    title={`Remove ${name}`}
                    aria-label={`Remove ${name}`}
                    disabled={busy}
                    onClick={() => handleRemove(member)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isOwner && (
        <form onSubmit={handleAdd} className="member-add-form">
          <h3>Add Team Member</h3>

          <div className="form-field">
            <label htmlFor="member-email">Registered email address</label>

            <input
              id="member-email"
              type="email"
              placeholder="teammate@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="member-role">Role</label>

            <select
              id="member-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={busy}>
            <UserPlus size={17} />
            {busy ? "Processing..." : "Add Member"}
          </button>
        </form>
      )}
    </div>
  );
}

export default MembersPanel;
