/* ══════════════════════════════════════════════════════
   DEAR MUSÉ — ARTISTIC EFFECTS JS
   Falling Tuyet Mai (White Flowers)
══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('artistic-effects-container')) return;

  const container = document.createElement('div');
  container.id = 'artistic-effects-container';
  container.setAttribute('aria-hidden', 'true');
  document.body.appendChild(container);

  // Tuyet Mai Flower SVG template
  const createTuyetMaiSVG = () => `
    <svg viewBox="-10 -10 20 20" width="100%" height="100%" overflow="visible">
      <circle cx="0" cy="-6" r="3.5"/>
      <circle cx="5.7" cy="-1.8" r="3.5"/>
      <circle cx="3.5" cy="4.8" r="3.5"/>
      <circle cx="-3.5" cy="4.8" r="3.5"/>
      <circle cx="-5.7" cy="-1.8" r="3.5"/>
      <circle cx="0" cy="0" r="1.5" fill="#fff9e6"/>
    </svg>
  `;

  const flowerCount = window.innerWidth < 768 ? 25 : 50;

  for (let i = 0; i < flowerCount; i++) {
    const flower = document.createElement('div');
    flower.classList.add('dm-tuyet-mai');
    
    // Set inner HTML to SVG
    flower.innerHTML = createTuyetMaiSVG();
    
    // Randomize properties
    const size = Math.random() * 15 + 10; // 10px to 25px
    const leftPos = Math.random() * 100; // 0% to 100%
    const duration = Math.random() * 10 + 10; // 10s to 20s
    const delay = Math.random() * -20; // negative delay to start immediately at different positions
    const drift = (Math.random() - 0.5) * 200; // -100px to 100px
    const rotation = (Math.random() - 0.5) * 720; // random rotation
    const scale = Math.random() * 0.5 + 0.6;
    
    flower.style.width = `${size}px`;
    flower.style.height = `${size}px`;
    flower.style.left = `${leftPos}%`;
    flower.style.setProperty('--duration', `${duration}s`);
    flower.style.setProperty('--delay', `${delay}s`);
    flower.style.setProperty('--drift', `${drift}px`);
    flower.style.setProperty('--rot', `${rotation}deg`);
    flower.style.setProperty('--scale', scale);
    flower.style.setProperty('--max-opacity', `${Math.random() * 0.4 + 0.5}`);

    container.appendChild(flower);
  }

  // ─── Mascot Widget Interactivity & Chroma Keying ───
  const mascotWidget = document.getElementById('mascot-widget');
  const mascotBubble = document.getElementById('mascot-bubble');
  const mascotCanvas = document.getElementById('mascot-canvas');
  const mascotVideo = document.getElementById('mascot-video');
  
  if (mascotWidget && mascotBubble && mascotCanvas && mascotVideo) {
    const ctx = mascotCanvas.getContext('2d', { willReadFrequently: true });
    
    // Set initial resolution of the canvas (small for low CPU, vertical ratio)
    mascotCanvas.width = 256;
    mascotCanvas.height = 280; 
    
    let isVideoPlaying = false;

    // Load and render placeholder image immediately on load
    const placeholderImg = new Image();
    placeholderImg.src = '/image/mascot_processed.png';
    placeholderImg.onload = () => {
      if (!isVideoPlaying) {
        ctx.clearRect(0, 0, mascotCanvas.width, mascotCanvas.height);
        ctx.drawImage(placeholderImg, 0, 0, mascotCanvas.width, mascotCanvas.height);
        mascotCanvas.style.opacity = '1';
      }
    };
    
    // Chroma key parameters (calibrated to the green screen: R=12, G=160, B=35)
    const targetR = 12;
    const targetG = 160;
    const targetB = 35;
    const threshold = 90;
    const smoothness = 35;
    
    // Recalculate size to match video aspect ratio when video metadata is ready
    function adjustCanvasSize() {
      const videoWidth = mascotVideo.videoWidth || 545;
      const videoHeight = mascotVideo.videoHeight || 599;
      const ratio = videoHeight / videoWidth;
      mascotCanvas.width = 256;
      mascotCanvas.height = Math.round(256 * ratio);
    }

    mascotVideo.addEventListener('loadedmetadata', adjustCanvasSize);
    if (mascotVideo.readyState >= 1) {
      adjustCanvasSize();
    }
    
    function processChromaKey() {
      if (mascotVideo.paused || mascotVideo.ended) {
        requestAnimationFrame(processChromaKey);
        return;
      }
      
      // Draw frame and scale it down to canvas size
      ctx.drawImage(mascotVideo, 0, 0, mascotCanvas.width, mascotCanvas.height);
      
      const frame = ctx.getImageData(0, 0, mascotCanvas.width, mascotCanvas.height);
      const data = frame.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        
        // Euclidean distance in RGB color space
        const dist = Math.sqrt(
          (r - targetR) ** 2 +
          (g - targetG) ** 2 +
          (b - targetB) ** 2
        );
        
        if (dist < threshold) {
          data[i+3] = 0; // Transparent
        } else if (dist < threshold + smoothness) {
          const factor = (dist - threshold) / smoothness;
          data[i+3] = Math.round(factor * 255); // Soft feathered edge
        }
      }
      
      ctx.putImageData(frame, 0, 0);
      
      // If we successfully drew a keyed frame, make sure canvas is visible
      if (!isVideoPlaying) {
        isVideoPlaying = true;
        mascotCanvas.style.opacity = '1';
      }
      
      requestAnimationFrame(processChromaKey);
    }
    
    // Start keying when video plays
    mascotVideo.addEventListener('playing', () => {
      isVideoPlaying = true;
      requestAnimationFrame(processChromaKey);
    });
    
    // Autoplay fallback
    if (mascotVideo.readyState >= 2) {
      mascotVideo.play().catch(() => {});
    }
    
    // If already playing or starts playing immediately
    if (!mascotVideo.paused) {
      isVideoPlaying = true;
      requestAnimationFrame(processChromaKey);
    }

    // Try to trigger video play on early document interactions to bypass autoplay policy
    const triggerVideoPlay = () => {
      if (mascotVideo.paused) {
        mascotVideo.play().then(() => {
          document.removeEventListener('click', triggerVideoPlay);
          document.removeEventListener('touchstart', triggerVideoPlay);
        }).catch(() => {});
      }
    };
    document.addEventListener('click', triggerVideoPlay);
    document.addEventListener('touchstart', triggerVideoPlay);
    
    // Bubble messages cycle (shortened to be natural, brief, and punchy)
    const bubbleText = mascotBubble.querySelector('span');
    const bubbleMessages = [
      "Xin chào! 👋",
      "Cười lên nha! 😊",
      "Cần tư vấn? ✨",
      "Chụp ảnh nhé? 📸",
      "Ngày lành nha! 🌸",
      "Thương mến! 💕"
    ];
    let msgIdx = 0;
    
    // Periodically cycle messages every 15 seconds
    setInterval(() => {
      if (mascotWidget.classList.contains('active-bubble') || document.activeElement === mascotWidget) return;
      
      msgIdx = (msgIdx + 1) % bubbleMessages.length;
      if (bubbleText) bubbleText.innerHTML = bubbleMessages[msgIdx];
      
      // Auto show bubble for 5 seconds
      mascotWidget.classList.add('active-bubble');
      setTimeout(() => {
        if (!mascotWidget.matches(':hover')) {
          mascotWidget.classList.remove('active-bubble');
        }
      }, 5000);
    }, 15000);
    
    // Sparkle particles list
    const sparklesList = ['✨', '✨', '💖', '⭐', '🌸', '🎵', '💫', '🎈'];
    
    const createSparkles = (count) => {
      for (let i = 0; i < count; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'mascot-sparkle';
        sparkle.innerText = sparklesList[Math.floor(Math.random() * sparklesList.length)];
        
        // Radial spread calculations
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 140;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        const tr = (Math.random() - 0.5) * 180;
        const dur = 1.0 + Math.random() * 1.2;
        
        sparkle.style.setProperty('--tx', `${tx}px`);
        sparkle.style.setProperty('--ty', `${ty}px`);
        sparkle.style.setProperty('--tr', `${tr}deg`);
        sparkle.style.setProperty('--duration', `${dur}s`);
        
        // Emitting from the center of the mascot
        sparkle.style.left = `50%`;
        sparkle.style.top = `60%`;
        
        mascotWidget.appendChild(sparkle);
        
        // Cleanup after animation finishes
        setTimeout(() => {
          sparkle.remove();
        }, dur * 1000);
      }
    };
    
    // Continuous ambient particles (spawns 1 particle every 4 seconds)
    setInterval(() => {
      if (document.hidden) return;
      if (!mascotWidget.matches(':hover')) {
        createSparkles(1);
      }
    }, 4000);
    
    // Initial hello after load
    setTimeout(() => {
      mascotWidget.classList.add('active-bubble');
      createSparkles(4);
      setTimeout(() => {
        if (!mascotWidget.matches(':hover')) {
          mascotWidget.classList.remove('active-bubble');
        }
      }, 5000);
    }, 2500);
 
    // Hover events
    mascotWidget.addEventListener('mouseenter', () => {
      mascotWidget.classList.add('active-bubble');
      createSparkles(6);
    });
 
    mascotWidget.addEventListener('mouseleave', () => {
      mascotWidget.classList.remove('active-bubble');
    });
 
    // Click events: make mascot bounce and burst out sparkles
    mascotWidget.addEventListener('click', () => {
      createSparkles(10);
      
      // Cute bounce animation on the canvas element
      mascotCanvas.style.transform = 'scale(1.18) translateY(-12px) rotate(5deg)';
      setTimeout(() => {
        mascotCanvas.style.transform = '';
      }, 300);
      
      // Attempt to play the video if user interaction enables audio context/playback
      if (mascotVideo.paused) {
        mascotVideo.play().catch(() => {});
      }
      
      // Select a random message instantly
      const randomMsg = bubbleMessages[Math.floor(Math.random() * bubbleMessages.length)];
      if (bubbleText) bubbleText.innerHTML = randomMsg;
      mascotWidget.classList.add('active-bubble');
    });

    // --- Chatbot Logic ---
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotCloseBtn = document.getElementById('chatbot-close-btn');
    const chatbotBtn = document.getElementById('mascot-btn-chatbot');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotForm = document.getElementById('chatbot-form');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSuggestions = document.getElementById('chatbot-suggestions');

    if (chatbotWindow && chatbotCloseBtn && chatbotBtn && chatbotMessages && chatbotForm && chatbotInput && chatbotSuggestions) {
      
      const toggleChatbot = () => {
        chatbotWindow.classList.toggle('open');
        // Auto scroll to bottom when opening
        if (chatbotWindow.classList.contains('open')) {
          setTimeout(() => {
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
          }, 100);
        }
      };

      chatbotBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleChatbot();
      });

      chatbotCloseBtn.addEventListener('click', () => {
        chatbotWindow.classList.remove('open');
      });

      // Close when clicking outside chatbot window (except mascot-widget)
      document.addEventListener('click', (e) => {
        if (!chatbotWindow.contains(e.target) && !mascotWidget.contains(e.target)) {
          chatbotWindow.classList.remove('open');
        }
      });

      const formatMarkdownToHTML = (text) => {
        if (!text) return '';
        return text
          .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; border-radius: 8px; margin: 8px 0; border: 1.5px solid var(--bone); display: block; background: #fff;" loading="lazy">')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/`([^`]+)`/g, '<code>$1</code>')
          .replace(/\r?\n/g, '<br>');
      };

      const appendMessage = (text, sender) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chatbot-msg ${sender}`;
        
        const textDiv = document.createElement('div');
        textDiv.className = 'chatbot-bubble-text';
        textDiv.innerHTML = formatMarkdownToHTML(text);
        
        msgDiv.appendChild(textDiv);
        chatbotMessages.appendChild(msgDiv);
        
        // Scroll to bottom
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
      };

      const showTypingIndicator = () => {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chatbot-msg bot temp-typing';
        
        const bubble = document.createElement('div');
        bubble.className = 'chatbot-bubble-text';
        bubble.style.display = 'flex';
        bubble.style.gap = '4px';
        bubble.style.alignItems = 'center';
        bubble.innerHTML = `
          <span style="width:6px;height:6px;background:#9C8474;border-radius:50%;animation:typingBounce 1s infinite alternate"></span>
          <span style="width:6px;height:6px;background:#9C8474;border-radius:50%;animation:typingBounce 1s infinite alternate;animation-delay:0.2s"></span>
          <span style="width:6px;height:6px;background:#9C8474;border-radius:50%;animation:typingBounce 1s infinite alternate;animation-delay:0.4s"></span>
        `;
        
        typingDiv.appendChild(bubble);
        chatbotMessages.appendChild(typingDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        return typingDiv;
      };

      // Inline typing bounce keyframes
      if (!document.getElementById('chatbot-typing-keyframes')) {
        const style = document.createElement('style');
        style.id = 'chatbot-typing-keyframes';
        style.innerHTML = `
          @keyframes typingBounce {
            0% { transform: translateY(0); opacity: 0.3; }
            100% { transform: translateY(-4px); opacity: 1; }
          }
        `;
        document.head.appendChild(style);
      }

      let chatHistory = [];

      const handleUserMessage = async (text) => {
        appendMessage(text, 'user');
        
        if (window.trackEvent) {
          window.trackEvent('click_element', 'Chatbot: Message Sent');
        }
        
        const typingIndicator = showTypingIndicator();
        
        try {
          const res = await fetch('/api/chatbot', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: text,
              history: chatHistory
            })
          });
          const data = await res.json();
          
          typingIndicator.remove();
          appendMessage(data.response, 'bot');
          
          // Lưu vào lịch sử cho lượt chat tiếp theo
          chatHistory.push({ sender: 'user', text: text });
          chatHistory.push({ sender: 'bot', text: data.response });
          
        } catch (err) {
          console.error('Chatbot fetch error:', err);
          typingIndicator.remove();
          appendMessage('Dạ, kết nối bị gián đoạn. Bạn thử lại nhé! 😭', 'bot');
        }
      };

      // Form submit
      chatbotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatbotInput.value.trim();
        if (!text) return;
        chatbotInput.value = '';
        handleUserMessage(text);
      });

      // Suggestion buttons
      chatbotSuggestions.addEventListener('click', (e) => {
        const btn = e.target.closest('.chatbot-suggest-btn');
        if (!btn) return;
        const text = btn.textContent;
        
        handleUserMessage(text);
      });
    }
  }
});
