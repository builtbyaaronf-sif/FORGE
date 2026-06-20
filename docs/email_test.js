import { Resend } from 'resend'; //

// Initialize Resend with your API key
const resend = new Resend('re_at7hz4PR_8SYysWsicVXCrFQbtz614pxd'); //

async function sendCorporateEmail() {
  try {
    const { data, error } = await resend.emails.send({ //
      from: 'growth@forgeisagentic.tech', // Must match your verified domain
      to: 'your-personal-email@gmail.com', // Change to your testing recipient email
      subject: 'FORGE Tech Stack Verification',
      html: '<strong>Hello from Visual Studio Code!</strong> This is a verified automated send for FORGE.' //
    });

    if (error) {
      return console.error('Resend Error:', error); //
    }

    console.log('Success! Email tracking ID:', data.id); //
  } catch (err) {
    console.error('System Failure:', err);
  }
}

// Execute the function
sendCorporateEmail();