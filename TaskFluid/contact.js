document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contactForm');
    const thankYouMessage = document.getElementById('thankyouMessage');

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: new FormData(form),
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    // Hide the form
                    form.style.display = 'none';
                    // Show thank you message
                    thankYouMessage.style.display = 'block';
                    // Reset the form
                    form.reset();
                } else {
                    throw new Error('Form submission failed');
                }
            } catch (error) {
                alert('Oops! There was a problem sending your message. Please try again.');
                console.error(error);
            }
        });
    }
});