document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";

  const composeForm = document.querySelector("#compose-form");

  composeForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const recipients = document.querySelector("#compose-recipients").value;
    const subject = document.querySelector("#compose-subject").value;
    const body = document.querySelector("#compose-body").value;
    fetch("/emails", {
      method: "POST",
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body,
      }),
    })
      .then((response) => response.data())
      .then((result) => {
        // Print result
        console.log(result);
      }); // TODO: REACT
  });
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      // Print emails
      console.log(emails);
      // ... do something else with emails ...

      emails.forEach((email) => {
        const email_view = document.createElement("div");
        email_view.className = "email_view";

        //TODO: prevent more characters shown on emails.
        if (mailbox === "archive") {
          email_view.innerHTML = `
            <div class="vieweing_user">${email.sender}</div>
            <div><strong>${email.subject}</strong> ${email.body}</div>
            <button class="archive" data-id="${email.id}">Unarchive</button>
          `;
        } else if (mailbox === "inbox") {
          email_view.innerHTML = `
            <div class="vieweing_user">${email.sender}</div>
            <div><strong>${email.subject}</strong> ${email.body}</div>
            <button class="archive" data-id="${email.id}" > Archive</button>
          `;
        } else if (mailbox === "sent") {
          email_view.innerHTML = `
            <div class="vieweing_user">${email.recipients[0]}</div>
            <div><strong>${email.subject}</strong> ${email.body}</div>
          `;
        }

        email_view.addEventListener("click", function () {
          console.log("This element has been clicked!");
        });
        document.querySelector("#emails-view").append(email_view);
      });
    });
}

document.addEventListener("click", (e) => {
  if (e.target.className === "archive") {
    e.stopPropagation(); //TODO: it doesn't work for now

    const e_id = parseInt(e.target.dataset.id);
    fetch(`/emails/${e_id}`)
      .then((response) => response.json())
      .then((email) => {
        // ... do something else with email ...
        const newStatus = !email.archived;

        fetch(`/emails/${e_id}`, {
          method: "PUT",
          body: JSON.stringify({
            archived: newStatus,
          }),
        }).then(() => {
          //TODO: add animation effects
          newStatus ? load_mailbox("inbox") : load_mailbox("archive");
        });
      });
  }
});
