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
  const composeForm = document.querySelector("#compose-form");

  composeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    compose_it();
  });

  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_it() {
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
    .then(async (response) => {
      const data = await response.json();
      return { status: response.status, data: data };
    })
    .then((result) => {
      console.log(result.data);
      if (result.status === 201) {
        load_mailbox("sent");
        console.log("sent");
      } else {
        console.log("not sent!");
        return alert(`${result.data.error}`);
      }
    });
}

function compose_email() {
  // Push state for compose view
  history.pushState({ view: "compose" }, "", "#compose");

  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#contents").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}

function load_mailbox(mailbox) {
  // Push state for mailbox view
  history.pushState({ view: "mailbox", mailbox: mailbox }, "", `#${mailbox}`);

  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#contents").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      emails.forEach((email) => {
        const email_cards = document.createElement("div");
        email_cards.className = "email_cards";
        email_cards.dataset.id = email.id;
        if (email.read === true) email_cards.classList.add("seen");

        if (mailbox === "archive") {
          common_to_all();
          add_archive_button("Unarchive");
        } else if (mailbox === "inbox") {
          common_to_all();
          add_archive_button("Archive");
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
          span_viewing_user.innerHTML = `${email.sender}`;
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

        function add_archive_button(label) {
          const button = Object.assign(document.createElement("button"), {
            className: "archive",
          });
          button.dataset.id = `${email.id}`;
          button.innerHTML = label;
          email_cards.appendChild(button);
        }

        // clicking features
        email_cards.addEventListener("click", function (e) {
          if (e.target.tagName.toLowerCase() === "button") {
            const e_id = parseInt(email_cards.dataset.id);
            fetch(`/emails/${e_id}`)
              .then((response) => response.json())
              .then((email) => {
                const newStatus = !email.archived;
                async function archive() {
                  await fetch(`/emails/${e_id}`, {
                    method: "PUT",
                    body: JSON.stringify({
                      archived: newStatus,
                    }),
                  });
                  load_mailbox("inbox");
                }
                archive();
              });

            return;
          }

          fetch(`/emails/${email_cards.dataset.id}`, {
            method: "PUT",
            body: JSON.stringify({
              read: true,
            }),
          }).then(() => {
            load_email(email_cards.dataset.id);
          });
        });

        document.querySelector("#emails-view").append(email_cards);
      });
    });
}

function load_email(ide) {
  // Push state for individual email view
  history.pushState({ view: "email", email_id: ide }, "", `#email-${ide}`);

  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#contents").style.display = "block";
  document.querySelector("#contents").innerHTML = "";

  fetch(`/emails/${ide}`)
    .then((response) => response.json())
    .then((email) => {
      const email_contents = Object.assign(document.createElement("div"), {
        className: "contents-view",
      });
      const div_main = Object.assign(document.createElement("div"), {
        className: "email_cards",
      });
      const h4_header = document.createElement("h4");
      h4_header.innerHTML = `${email.subject}`;
      email_contents.appendChild(h4_header);

      const h6_header = Object.assign(document.createElement("h6"), {
        className: "h6-header",
      });

      const sender = document.createElement("strong");
      sender.innerText = `from ${email.sender} to=> `;
      h6_header.appendChild(sender);

      const currentUser = document.getElementById("h2-email").innerText;
      if (email.sender !== currentUser) {
        const to = document.createElement("span");
        to.innerHTML = "me";
        h6_header.appendChild(to);

        email.recipients
          .filter((email) => email !== currentUser)
          .forEach((email) => {
            const to = document.createElement("span");
            to.innerHTML = `, ${email}`;
            h6_header.appendChild(to);
          });
      } else {
        email.recipients.forEach((email) => {
          const to = document.createElement("span");
          to.innerHTML = `, ${email}`;
          h6_header.appendChild(to);
        });
      }

      const div_2_time = Object.assign(document.createElement("div"), {
        className: "time",
      });
      div_2_time.innerHTML = `${email.timestamp}`;
      h6_header.appendChild(div_2_time);

      email_contents.appendChild(h6_header);

      const body = Object.assign(document.createElement("div"), {
        className: "email_body",
      });
      email.body
        .split("\n")
        .filter((para) => para.trim() !== "")
        .forEach((para) => {
          const pr = document.createElement("p");
          pr.textContent = para;
          body.appendChild(pr);
        });
      email_contents.appendChild(body);

      document.querySelector("#contents").appendChild(email_contents);

      const extra_buttons = Object.assign(document.createElement("div"), {
        className: "ex_btns",
      });
      if (currentUser !== email.sender) {
        const reply = Object.assign(document.createElement("button"), {
          className: "btn btn-sm btn-outline-primary",
          id: "reply",
        });
        reply.innerText = "Reply";

        const arch = Object.assign(document.createElement("button"), {
          className: "btn btn-sm btn-outline-primary",
          id: "arch",
        });
        arch.innerText = email.archived ? "Unarchrive" : "Archrive";

        extra_buttons.appendChild(reply);
        extra_buttons.appendChild(arch);
      }

      const seen1 = Object.assign(document.createElement("button"), {
        className: "btn btn-sm btn-outline-primary",
        id: "seen1",
      });
      seen1.innerText = "Mark as unread";

      extra_buttons.appendChild(seen1);
      document.querySelector("#contents").appendChild(extra_buttons);
      functionality(email, extra_buttons, currentUser);
    });
}

function functionality(email, extra_buttons, currentUser) {
  extra_buttons.addEventListener("click", function (e) {
    if (e.target.id === "arch") {
      const e_id = parseInt(email.id);
      fetch(`/emails/${e_id}`)
        .then((response) => response.json())
        .then((email) => {
          const newStatus = !email.archived;

          async function archive() {
            await fetch(`/emails/${e_id}`, {
              method: "PUT",
              body: JSON.stringify({
                archived: newStatus,
              }),
            });
            load_mailbox("inbox");
          }
          archive();
        });
    } else if (e.target.id === "seen1") {
      const e_id = parseInt(email.id);
      fetch(`/emails/${e_id}`, {
        method: "PUT",
        body: JSON.stringify({
          read: false,
        }),
      }).then(() => {
        load_mailbox("inbox");
      });
    } else if (e.target.id === "reply") {
      load_reply(email.sender, currentUser);
    }
  });
}

function load_reply(sender, currentUser) {
  // Push state for reply view
  history.pushState(
    { view: "reply", sender: sender, currentUser: currentUser },
    "",
    `#reply-${sender}`
  );

  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#contents").style.display = "block";
  document.querySelectorAll(".reply").forEach((form) => {
    form.innerText = "";
  });

  const reply = Object.assign(document.createElement("div"), {
    className: "reply",
  });
  reply.innerHTML = ` <nav></nav><div id="reply-block">
  <h5>Reply</h5>
  <form id="compose-form">
    <div class="form-group">
      From:
      <input disabled class="form-control" value="${currentUser}" />
    </div>
    <div class="form-group">
      To: <input disabled id="compose-recipients" class="form-control" value="${sender}" />
    </div>
    <div class="form-group">
      <input class="form-control" id="compose-subject" placeholder="Subject" />
    </div>
    <textarea
      class="form-control"
      id="compose-body"
      placeholder="Body"
    ></textarea>
    <input type="submit" class="btn btn-primary" />
  </form>
</div>`;
  document.querySelector("#contents").appendChild(reply);

  reply.addEventListener("submit", function (e) {
    e.preventDefault();
    compose_it();
  });
}

// Popstate handler for browser back/forward navigation
window.addEventListener("popstate", (event) => {
  const state = event.state;

  if (!state) {
    load_mailbox("inbox");
    return;
  }

  if (state.view === "mailbox") {
    load_mailbox(state.mailbox);
  } else if (state.view === "email") {
    load_email(state.email_id);
  } else if (state.view === "compose") {
    compose_email();
  } else if (state.view === "reply") {
    load_reply(state.sender, state.currentUser);
  }
});
