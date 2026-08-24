import React from "react";

export default function EmployerNotificationStack({ notifQueue }) {
  return (
    <div className="notif-stack">
      {notifQueue.map((n) => (
        <div
          key={n.id}
          className={`notif ${
            n.kind === "success"
              ? "notif--success"
              : n.kind === "error"
              ? "notif--error"
              : "notif--info"
          }`}
        >
          <div className="notif__title">{n.title}</div>
          <div className="notif__body">{n.body}</div>
        </div>
      ))}
    </div>
  );
}
