import { members } from "../data/mockData";

function TeamMembers() {
  return (
    <section className="page">
      <div className="page-heading">
        <h1>Team Members</h1>
        <p>People working across your projects.</p>
      </div>

      <div className="section-card">
        <h2>Workspace Team</h2>

        <div className="member-grid">
          {members.map((member) => (
            <article className="member-card" key={member.id}>
              <div className="member-avatar">
                {member.name
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </div>

              <h3>{member.name}</h3>
              <p>{member.role}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TeamMembers;
