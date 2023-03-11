document.addEventListener('DOMContentLoaded', function() {
    // hide menu
    toggle_menu("none");
    //document.querySelectorAll(".notmenu").forEach(element => {toggle_menu("flex")});

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);
    //document.querySelectorAll('.mail-div').forEach.addEventListener('click', read_mail);
    
    // By default, load the inbox
    load_mailbox('inbox');

    // Enable email submition
    document.querySelector('#compose-form').onsubmit = async (event) => {
        event.preventDefault();
        
        let recipients = document.querySelector('#compose-recipients').value;
        const subject = document.querySelector('#compose-subject').value;
        const body = document.querySelector('#compose-body').value;
        
        const response = await fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: recipients,
                subject: subject,
                body: body,
            })
        })
        load_mailbox('sent');
        
        return false;
    }
    
});


async function compose_email() {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#read-mail').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    
    // Reply messages
    if (this.id === 'reply-btn') {
        const response = await fetch(`/emails/${this.dataset.emailId}`);
        const mail = await response.json();
        document.querySelector('#compose-recipients').value = mail.sender;
        if (mail.subject.search("Re:") === 0) {
            document.querySelector('#compose-subject').value = mail.subject;
        } else {
            document.querySelector('#compose-subject').value = `Re: ${mail.subject}`;
        }
        document.querySelector('#compose-body').value = `On ${mail.timestamp} ${mail.sender} wrote: ${mail.body}\n\n`;
        
    } else {
        // Clear out composition fields
        document.querySelector('#compose-recipients').value = '';
        document.querySelector('#compose-subject').value = '';
        document.querySelector('#compose-body').value = '';
    }
    
}

async function load_mailbox(mailbox) {
  
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#read-mail').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    
    // Get the appropriate mails in the mailbox
    const response = await fetch(`/emails/${mailbox}`);
    const mails = await response.json();
    
    // Show the mailbox name
    const emailsView = document.querySelector('#emails-view');
    const menuSpan = document.createElement('span');
    const h3 = document.createElement('h3');
    menuSpan.id = "menuSpan";
    menuSpan.onclick = () => { toggle_menu("flex") };
    menuSpan.innerHTML = `<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg"
                                xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	                            width="24.75px" height="24.75px" viewBox="0 0 24.75 24.75" 
	                            style="enable-background:new 0 0 24.75 24.75;" xml:space="preserve">
                            <g>
	                           <path d="M0,3.875c0-1.104,0.896-2,2-2h20.75c1.104,0,2,0.896,2,2s-0.896,2-2,2H2C0.896,5.875,0,4.979,0,3.875z M22.75,10.375H2
	                           	c-1.104,0-2,0.896-2,2c0,1.104,0.896,2,2,2h20.75c1.104,0,2-0.896,2-2C24.75,11.271,23.855,10.375,22.75,10.375z M22.75,18.875H2
	                        	c-1.104,0-2,0.896-2,2s0.896,2,2,2h20.75c1.104,0,2-0.896,2-2S23.855,18.875,22.75,18.875z"/>
                            </g>
                            </svg>`;
    emailsView.append(menuSpan);
    h3.append(`${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`);
    emailsView.append(h3);
    
    // Show the mails gotten
    for (let i in mails) {
        const mailDiv = document.createElement('div');
        mailDiv.id = mails[i].id;
        mailDiv.class = "mail-div";
        //Read mail
        mailDiv.onclick = async () => {
            // Show the mail and hide other views
            document.querySelector('#emails-view').style.display = 'none';
            document.querySelector('#read-mail').style.display = 'block';
            document.querySelector('#compose-view').style.display = 'none';
            
            // Get the mail
            const response = await fetch(`/emails/${mailDiv.id}`);
            const mail = await response.json();
            
            // Display the mail
            document.querySelector('#sender').append(mail.sender);
            document.querySelector('#recipients').append(mail.recipients);
            document.querySelector('#subject').innerHTML = `${mail.subject} <span>${mail.timestamp}</span>`;
            document.querySelector('#main-body').innerHTML = `${mail.body}`;
            
            // implement archive button
            const button = document.querySelector('#toggle-archive');
            if (mailbox === 'sent') {
                button.style.display = 'none';
            } else if (mailbox === 'inbox') {
                button.style.display = 'initial';
                button.innerHTML = "Archive";
                button.onclick = async () => {
                    await fetch(`/emails/${mailDiv.id}`, {
                        method: "PUT",
                        body: JSON.stringify({
                            archived: true,
                        }),
                    });
                    load_mailbox('inbox');
                }
            } else {
                button.style.display = 'initial';
                button.innerHTML = "Unarchive";
                button.onclick = async () => {
                    await fetch(`/emails/${mailDiv.id}`, {
                        method: "PUT",
                        body: JSON.stringify({
                            archived: false,
                        }),
                    });
                    load_mailbox('inbox');
                }
            }
            
            // Implement reply
            const reply_btn = document.querySelector('#reply-btn');
            if (mailbox === 'sent') {
                reply_btn.style.display = 'none';
            } else {
                reply_btn.style.display = 'initial';
            }
            reply_btn.dataset.emailId = mailDiv.id;
            reply_btn.onclick = compose_email;
            
            // Mark read
            await fetch(`/emails/${mailDiv.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    read: true,
                }),
            })
            
        }
        
        if (mails[i].read) {
            mailDiv.style.backgroundColor = "blue";
        }
        mailDiv.innerHTML = `<p>${mails[i].sender}</p><span>${mails[i].subject}</span><span>${mails[i].timestamp}</span>`
        emailsView.append(mailDiv);
    }
    
}

function toggle_menu(displayType) {
    document.querySelectorAll('.menu-item').forEach(element => {element.style.display = displayType});
}