import { Link, useParams } from "react-router-dom";
import { ADMIN_MENU } from "../adminMenu";

// Placeholder for each admin menu option. These get built in a later sprint.
export default function AdminSectionPage() {
  const { section } = useParams();
  const item = ADMIN_MENU.find((m) => m.path === section);

  if (!item) {
    return <p className="notice">That admin page doesn't exist. <Link to="/admin">Back to the admin portal</Link></p>;
  }

  return (
    <>
      <Link to="/admin" className="back">← Admin portal</Link>
      <h1>{item.title}</h1>
      <div className="empty">
        <h2>Coming in a later sprint</h2>
        <p>{item.text}</p>
      </div>
    </>
  );
}
