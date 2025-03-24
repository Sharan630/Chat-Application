document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const chatScreen = document.getElementById('chat-screen');
    const usernameInput = document.getElementById('username-input');
    const joinBtn = document.getElementById('join-btn');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const messagesContainer = document.getElementById('messages-container');
    const userList = document.getElementById('user-list');
    const typingIndicator = document.getElementById('typing-indicator');
    const sidebar = document.getElementById('sidebar');
    const mobileSidebarToggle = document.querySelector('.mobile-sidebar-toggle');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const emojiBtn = document.getElementById('emoji-btn');
    const emojiPicker = document.getElementById('emoji-picker');
    const emojiClose = document.querySelector('.emoji-close');
    const themeToggle = document.getElementById('theme-toggle');
  
    const socket = io();
  
    let currentUserId = null;
    let typingTimeout = null;
  
    function init() {

      joinBtn.addEventListener('click', joinChat);
      usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinChat();
      });

      sendBtn.addEventListener('click', sendMessage);
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
      });
      
      messageInput.addEventListener('input', handleTyping);
 
      mobileSidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
      });
  
      settingsBtn.addEventListener('click', () => {
        settingsMenu.classList.toggle('active');
      });
  
      emojiBtn.addEventListener('click', () => {
        emojiPicker.classList.toggle('active');
      });
  
      emojiClose.addEventListener('click', () => {
        emojiPicker.classList.remove('active');
      });

      themeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-theme');
      });
      
      document.addEventListener('click', (e) => {
        if (!settingsBtn.contains(e.target) && !settingsMenu.contains(e.target)) {
          settingsMenu.classList.remove('active');
        }
        
        if (!emojiBtn.contains(e.target) && !emojiPicker.contains(e.target)) {
          emojiPicker.classList.remove('active');
        }
      });

      socket.on('login_success', handleLoginSuccess);
      socket.on('user_list', updateUserList);
      socket.on('message', displayMessage);
      socket.on('user_typing', showTypingIndicator);
    }
  
    function joinChat() {
      const username = usernameInput.value.trim();
      if (username) {
        socket.emit('user_join', username);
      }
    }
  
    function handleLoginSuccess(userId) {
      currentUserId = userId;
      loginScreen.classList.add('hidden');
      chatScreen.classList.remove('hidden');
      messageInput.focus();
    }
  
    function sendMessage() {
      const text = messageInput.value.trim();
      if (text) {
        socket.emit('send_message', { text });
        messageInput.value = '';
        socket.emit('typing', false);
        clearTimeout(typingTimeout);
      }
    }
  
    function handleTyping() {
      socket.emit('typing', true);
      
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        socket.emit('typing', false);
      }, 1000);
    }
  
    function showTypingIndicator(data) {
      if (data.isTyping && data.username) {
        typingIndicator.querySelector('.typing-text').textContent = `${data.username} is typing...`;
        typingIndicator.classList.remove('hidden');
      } else {
        typingIndicator.classList.add('hidden');
      }
    }
  
    function displayMessage(message) {
      const messageElement = document.createElement('div');
      let className = 'message';
      
      if (message.type === 'system') {
        className += ' system';
      } else if (message.userId === currentUserId) {
        className += ' outgoing';
      } else {
        className += ' incoming';
      }
      
      messageElement.className = className;
      
      if (message.type === 'system') {
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = message.text;
        messageElement.appendChild(messageContent);
      } else {
        messageElement.innerHTML = `
          <div class="message-content">${message.text}</div>
          <div class="message-info">
            ${message.type !== 'system' ? message.user + ' • ' : ''}
            ${formatTime(new Date(message.timestamp))}
          </div>
        `;
      }
      
      messagesContainer.appendChild(messageElement);
      scrollToBottom();
    }
  
    function updateUserList(users) {
      userList.innerHTML = '';
      users.forEach(user => {
        const li = document.createElement('li');
        li.className = 'user-item';
        const initials = user.charAt(0).toUpperCase();
        li.innerHTML = `
          <div class="user-avatar">${initials}</div>
          <div class="user-info">
            <div class="user-name">${user}</div>
            <div class="user-status">
              <span class="status-dot"></span>
              Online
            </div>
          </div>
        `;
        userList.appendChild(li);
      });
    }
  
    function formatTime(date) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  
    function scrollToBottom() {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
 
    function populateEmojiPicker() {
      const emojiContent = document.querySelector('.emoji-content');
      const commonEmojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', 
                           '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
                           '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩'];
      
      commonEmojis.forEach(emoji => {
        const emojiElement = document.createElement('div');
        emojiElement.className = 'emoji';
        emojiElement.textContent = emoji;
        emojiElement.addEventListener('click', () => {
          messageInput.value += emoji;
          emojiPicker.classList.remove('active');
          messageInput.focus();
        });
        emojiContent.appendChild(emojiElement);
      });
    }
  
    populateEmojiPicker();
    init();
  });