// countdown.js

document.addEventListener('DOMContentLoaded', () => {
    // Set the target date: May 26, 2026 00:00:00
    const targetDate = new Date('May 26, 2026 00:00:00').getTime();

    const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            document.querySelector('.coming-soon-title').innerHTML = 'Gaming Hub <span class="text-gradient">Live Now!</span>';
            document.querySelector('.countdown-container').style.display = 'none';
            return;
        }

        // Time calculations for days, hours, minutes and seconds
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Display the result in the corresponding elements
        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    };

    // Update the countdown every 1 second
    setInterval(updateCountdown, 1000);

    // Initial call to prevent delay
    updateCountdown();
});
