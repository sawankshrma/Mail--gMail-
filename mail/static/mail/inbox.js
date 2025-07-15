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
        load_mailbox("sent");
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
        email_view.dataset.id = email.id;
        if (email.read === true) email_view.classList.add("seen");

        if (mailbox === "archive") {
          email_view.innerHTML = `
            <div class="vieweing_user"><span class="sender">${email.sender}</span></div>
            <div>
              <strong><span class="subject">${email.subject}</span></strong>
              <span class="body-preview">${email.body}</span>
            </div>
            <div class = "time">${email.timestamp}</div>
            <button class="archive" data-id="${email.id}">Unarchive</button>
          `;
        } else if (mailbox === "inbox") {
          email_view.innerHTML = `
            <div class="vieweing_user"><span class="sender">${email.sender}</span></div>
            <div>
              <strong><span class="subject">${email.subject}</span></strong>
              <span class="body-preview">${email.body}</span>
            </div><div class = "time">${email.timestamp}</div>
            <button class="archive" data-id="${email.id}" > Archive</button>
            
          `;
          // console.log(email.timestamp);
        } else if (mailbox === "sent") {
          email_view.innerHTML = `
            <div class="vieweing_user"><span class="sender">${email.recipients[0]}</span></div>
            <div>
              <strong><span class="subject">${email.subject}</span></strong>
              <span class="body-preview">${email.body}</span>
            </div><div class = "time">${email.timestamp}</div>
          `;
        }

        email_view.addEventListener("click", function (e) {
          if (e.target.tagName.toLowerCase() === "button") {
            const e_id = parseInt(email_view.dataset.id);
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
                  load_mailbox("inbox");
                });
              });
            return;
          }

          console.log("This element has been clicked!");
          // email_view.classList.add("seen");

          fetch(`/emails/${email_view.dataset.id}`, {
            method: "PUT",
            body: JSON.stringify({
              read: true,
            }),
          }).then(() => {
            //TODO: change this load_mailbox to actually load the contents of the email
            load_mailbox(`${mailbox}`);
          });
        });
        document.querySelector("#emails-view").append(email_view);
      });
    });
}
