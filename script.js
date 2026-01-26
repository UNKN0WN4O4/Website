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

        const roomToggle = document.getElementById('roomToggle');
        const roomWindow = document.getElementById('roomWindow');
        const roomClose = document.getElementById('roomClose');
        const roomMinimize = document.getElementById('roomMinimize');
        const roomSend = document.getElementById('roomSend');
        const roomInput = document.getElementById('roomInput');
        const roomMessages = document.getElementById('roomMessages');
        const enterRoomLink = document.querySelector('.enter-room-btn');
        const roomToggleText = document.querySelector('.room-toggle-text');
        const floatingRoom = document.getElementById('floatingRoom');
        const roomHeader = document.querySelector('.room-header');

        let isDraggingRoom = false;
        let didDragRoom = false;
        let suppressToggleClick = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        const roomReplies = [
            "I hear you. That’s a lot to carry.",
            "You’re not alone in this.",
            "It makes sense to feel that way.",
            "I’m here. Keep going.",
            "Take your time—we can sit with it.",
            "Your feelings are valid."
        ];

        function openRoom() {
            if (!roomWindow) return;
            roomWindow.classList.add('open');
            roomWindow.classList.remove('collapsed');
            roomToggle?.classList.add('active');
            if (roomToggleText) roomToggleText.textContent = 'Close Room';
            setTimeout(() => roomInput?.focus(), 50);
        }

        function closeRoom() {
            roomWindow?.classList.remove('open');
            roomToggle?.classList.remove('active');
            if (roomToggleText) roomToggleText.textContent = 'Open Room';
        }

        function toggleRoom() {
            if (suppressToggleClick) return;
            if (!roomWindow) return;
            if (roomWindow.classList.contains('open')) {
                closeRoom();
            } else {
                openRoom();
            }
        }

        function minimizeRoom() {
            if (!roomWindow) return;
            roomWindow.classList.toggle('collapsed');
        }

        function appendRoomMessage(text, type) {
            if (!roomMessages) return;
            const msg = document.createElement('div');
            msg.className = `room-message ${type}`;
            msg.innerText = text;
            roomMessages.appendChild(msg);
            roomMessages.scrollTop = roomMessages.scrollHeight;
        }

        function sendRoomMessage() {
            if (!roomInput || !roomInput.value.trim()) return;
            const text = roomInput.value.trim();
            appendRoomMessage(text, 'you');
            roomInput.value = '';

            setTimeout(() => {
                const reply = roomReplies[Math.floor(Math.random() * roomReplies.length)];
                appendRoomMessage(reply, 'other');
            }, 800);
        }

        roomToggle?.addEventListener('click', toggleRoom);
        roomClose?.addEventListener('click', closeRoom);
        roomMinimize?.addEventListener('click', minimizeRoom);
        roomSend?.addEventListener('click', sendRoomMessage);

        roomInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendRoomMessage();
            }
        });

        enterRoomLink?.addEventListener('click', (e) => {
            e.preventDefault();
            openRoom();
        });

    function startRoomDrag(e) {
        if (!floatingRoom) return;
        isDraggingRoom = true;
        didDragRoom = false;
        suppressToggleClick = false;

        const rect = floatingRoom.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;

        // Set explicit top/left so subsequent drags stay anchored to the viewport
        floatingRoom.style.left = `${rect.left}px`;
        floatingRoom.style.top = `${rect.top}px`;
        floatingRoom.style.right = 'auto';
        floatingRoom.style.bottom = 'auto';

        floatingRoom.style.transition = 'none';
        document.addEventListener('pointermove', onRoomDrag);
        document.addEventListener('pointerup', endRoomDrag);
    }

    function onRoomDrag(e) {
        if (!isDraggingRoom || !floatingRoom) return;
        didDragRoom = true;

        const isOpen = roomWindow?.classList.contains('open');
        const currentWidth = floatingRoom.offsetWidth;
        const currentHeight = isOpen ? floatingRoom.offsetHeight : (roomToggle?.offsetHeight || floatingRoom.offsetHeight);

        const maxX = window.innerWidth - currentWidth - 8;
        const maxY = window.innerHeight - currentHeight - 8;
        const nextX = Math.min(Math.max(e.clientX - dragOffsetX, 8), Math.max(8, maxX));
        const nextY = Math.min(Math.max(e.clientY - dragOffsetY, 8), Math.max(8, maxY));

        floatingRoom.style.left = `${nextX}px`;
        floatingRoom.style.top = `${nextY}px`;
        floatingRoom.style.right = 'auto';
        floatingRoom.style.bottom = 'auto';
    }

    function endRoomDrag() {
        if (!isDraggingRoom || !floatingRoom) return;
        isDraggingRoom = false;
        floatingRoom.style.transition = '';
        document.removeEventListener('pointermove', onRoomDrag);
        document.removeEventListener('pointerup', endRoomDrag);

        if (didDragRoom) {
            suppressToggleClick = true;
            setTimeout(() => { suppressToggleClick = false; }, 120);
        }
    }

    roomToggle?.addEventListener('pointerdown', startRoomDrag);
    roomHeader?.addEventListener('pointerdown', startRoomDrag);
});