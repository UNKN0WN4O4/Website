document.addEventListener('DOMContentLoaded', () => {
    
    const joinButton = document.getElementById('joinButton');
    const ctaButton = document.getElementById('ctaButton');
    
    
    function connectToWorld() {
        const portal = document.querySelector('.portal-circle');
        const buttonText = document.getElementById('buttonText');
        const originalText = buttonText.innerText;
        
       
        portal.style.width = '200px';
        portal.style.borderRadius = '50px';
        portal.style.background = 'var(--primary)';
        buttonText.innerText = 'Initializing...';
        
        
        setTimeout(() => {
            alert("Welcome! The 3D Environment is currently under construction. Please check back soon for the full experience.");
            
            buttonText.innerText = originalText;
            portal.style.background = 'rgba(0, 0, 0, 0.6)';
            portal.style.width = ''; 
            portal.style.borderRadius = ''; 
        }, 1500);
    }

    
    if(joinButton) {
        joinButton.addEventListener('click', connectToWorld);
    }
    
    if(ctaButton) {
        ctaButton.addEventListener('click', (e) => {
            e.preventDefault(); 
            connectToWorld();
        });
    }
});