/*
==================================================
   AquaSafe AI - Chatbot Client-Side Module
==================================================
*/

document.addEventListener("DOMContentLoaded", () => {
    const trigger = document.getElementById("chat-trigger");
    const drawer = document.getElementById("chat-drawer");
    const closeBtn = document.getElementById("chat-close");
    const input = document.getElementById("chat-input-field");
    const sendBtn = document.getElementById("chat-send-btn");
    const messagesContainer = document.getElementById("chat-messages-container");
    const chipContainer = document.getElementById("chat-chips-container");
    
    if (!trigger || !drawer) return;

    // Toggle Chat Drawer
    trigger.addEventListener("click", () => {
        const isVisible = drawer.style.display === "flex";
        drawer.style.display = isVisible ? "none" : "flex";
        if (!isVisible) {
            input.focus();
            scrollToBottom();
        }
    });

    closeBtn.addEventListener("click", () => {
        drawer.style.display = "none";
    });

    // Send Message on Enter
    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    });

    sendBtn.addEventListener("click", () => {
        sendMessage();
    });

    // Handle Quick Action Chips
    if (chipContainer) {
        chipContainer.addEventListener("click", (e) => {
            if (e.target.classList.contains("chip-btn")) {
                const text = e.target.textContent;
                input.value = text;
                sendMessage();
            }
        });
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        // 1. Render User Message
        appendMessage("user", text);
        input.value = "";
        scrollToBottom();

        // 2. Render Typing Indicator
        const typingId = appendTypingIndicator();
        scrollToBottom();

        // 3. Request API response
        try {
            const response = await fetch("/api/chatbot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text })
            });
            const data = await response.json();
            
            // Remove Typing Indicator
            removeTypingIndicator(typingId);

            if (data && data.reply) {
                appendMessage("bot", data.reply);
            } else {
                appendMessage("bot", "Pardon, I encountered a connection issue. Please try again.");
            }
        } catch (err) {
            removeTypingIndicator(typingId);
            appendMessage("bot", "Network error. Unable to communicate with the AquaSafe AI core.");
            console.error("Chatbot API Error:", err);
        }
        
        scrollToBottom();
    }

    function appendMessage(sender, text) {
        const bubble = document.createElement("div");
        bubble.className = `chat-bubble ${sender}`;
        
        // Parse simple markdown-like elements (bold and lists)
        let formattedText = text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\n/g, "<li>$1</li>")
            .replace(/\n/g, "<br>");
            
        bubble.innerHTML = formattedText;
        messagesContainer.appendChild(bubble);
    }

    function appendTypingIndicator() {
        const id = "typing-" + Date.now();
        const bubble = document.createElement("div");
        bubble.id = id;
        bubble.className = "chat-bubble bot typing-indicator-bubble";
        bubble.innerHTML = `
            <div class="typing-indicator" style="display: flex; gap: 4px; align-items: center; justify-content: center; height: 16px;">
                <span class="dot" style="width: 6px; height: 6px; background-color: var(--text-muted); border-radius: 50%; animation: chatPulse 1.2s infinite ease-in-out; display: inline-block;"></span>
                <span class="dot" style="width: 6px; height: 6px; background-color: var(--text-muted); border-radius: 50%; animation: chatPulse 1.2s infinite ease-in-out 0.2s; display: inline-block;"></span>
                <span class="dot" style="width: 6px; height: 6px; background-color: var(--text-muted); border-radius: 50%; animation: chatPulse 1.2s infinite ease-in-out 0.4s; display: inline-block;"></span>
            </div>
            <style>
                @keyframes chatPulse {
                    0%, 100% { transform: translateY(0); opacity: 0.4; }
                    50% { transform: translateY(-4px); opacity: 1; }
                }
            </style>
        `;
        messagesContainer.appendChild(bubble);
        return id;
    }

    function removeTypingIndicator(id) {
        const indicator = document.getElementById(id);
        if (indicator) {
            indicator.remove();
        }
    }
});
