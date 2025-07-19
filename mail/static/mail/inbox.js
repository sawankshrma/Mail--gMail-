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
      // console.log(emails);

      emails.forEach((email) => {
        const email_cards = document.createElement("div");
        email_cards.className = "email_cards";
        email_cards.dataset.id = email.id;
        if (email.read === true) email_cards.classList.add("seen");

        if (mailbox === "archive") {
          common_to_all();
          add_archive("Unarchive");
        } else if (mailbox === "inbox") {
          common_to_all();
          add_archive("Archive");
        } else if (mailbox === "sent") {
          common_to_all();
        }

        function common_to_all() {
          const div_viewing_user = Object.assign(
            document.createElement("div"),
            { className: "viewing_user" }
          );
          const span_viewing_user = Object.assign(
            document.createElement("span"),
            { className: "sender" }
          );
          div_viewing_user.appendChild(span_viewing_user);

          const div_1 = document.createElement("div");
          const strong = Object.assign(document.createElement("strong"), {
            className: "subject",
          });
          strong.innerHTML = `${email.subject}`;
          const span_preview = Object.assign(document.createElement("span"), {
            className: "body-preview",
          });
          span_preview.innerHTML = `${email.body}`;
          div_1.appendChild(strong);
          div_1.appendChild(span_preview);

          const div_2_time = Object.assign(document.createElement("div"), {
            className: "time",
          });
          div_2_time.innerHTML = `${email.timestamp}`;

          email_cards.appendChild(div_viewing_user);
          email_cards.appendChild(div_1);
          email_cards.appendChild(div_2_time);
        }

        function add_archive(label) {
          const button = Object.assign(document.createElement("button"), {
            className: "archive",
          });
          button.dataset.id = `${email.id}`;
          button.innerHTML = label;
          email_cards.appendChild(button);
        }

        // clicking features:-

        email_cards.addEventListener("click", function (e) {
          // difference b/w normal and archive button click
          if (e.target.tagName.toLowerCase() === "button") {
            const e_id = parseInt(email_cards.dataset.id);
            p = fetch(`/emails/${e_id}`);
            p.then((response) => response.json()).then((email) => {
              const newStatus = !email.archived;

              async function archive() {
                await fetch(`/emails/${e_id}`, {
                  method: "PUT",
                  body: JSON.stringify({
                    archived: newStatus,
                  }),
                });
                //TODO: add animation effects
                load_mailbox("inbox");
              }
              archive();
            });

            return;
          }

          console.log("one of the email card has been clicked!");
          // email_cards.classList.add("seen");

          fetch(`/emails/${email_cards.dataset.id}`, {
            method: "PUT",
            body: JSON.stringify({
              read: true,
            }),
          }).then(() => {
            //TODO: change this load_mailbox to actually load the contents of the email
            load_mailbox(`${mailbox}`);
          });
        });
        document.querySelector("#emails-view").append(email_cards);
      });
    });
}
