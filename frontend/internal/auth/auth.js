var BACKEND_URL = (location.port === '5173') ? 'http://localhost:8060' : '';

var user = null;

var loadUser = function () {
  try {
    var stored = localStorage.getItem('auth_user');
    if (stored) user = JSON.parse(stored);
  } catch (e) {}
};

var saveUser = function (name, email, picture) {
  user = { name: name, email: email, picture: picture };
  localStorage.setItem('auth_user', JSON.stringify(user));
};

var clearUser = function () {
  user = null;
  localStorage.removeItem('auth_user');
  localStorage.removeItem('account_created');
};

var parseCallbackParams = function () {
  var params = new URLSearchParams(window.location.search);
  var name = params.get('name');
  var email = params.get('email');
  var picture = params.get('picture');

  if (name && email) {
    saveUser(decodeURIComponent(name), decodeURIComponent(email), picture ? decodeURIComponent(picture) : '');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
};

var updateDrawer = function () {
  var drawerNav = document.querySelector('.drawer_nav');
  if (!drawerNav) return;

  var existing = drawerNav.querySelector('.drawer_user_info');
  if (existing) existing.remove();

  if (!user) return;

  var li = document.createElement('li');
  li.className = 'drawer_user_info';
  li.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;padding:20px 0 10px;border-top:1px solid rgba(255,255,255,0.2);margin-top:8px;';

  var avatarHtml = '';
  if (user.picture) {
    avatarHtml = '<img src="' + user.picture + '" alt="avatar" style="width:48px;height:48px;border-radius:50%;object-fit:cover;">';
  }

  var accountStatus = '';
  if (localStorage.getItem('account_created') === 'true') {
    accountStatus = '<span style="font-family:Bruno Ace,sans-serif;font-size:12px;color:rgba(46,139,87,1);">Account created</span>';
  } else {
    accountStatus = '<span style="font-family:Bruno Ace,sans-serif;font-size:12px;color:rgba(184,150,12,1);">Account not created</span>';
  }

  li.innerHTML = avatarHtml +
    '<span style="font-family:Bruno Ace,sans-serif;font-size:16px;color:white;">' + user.name + '</span>' +
    '<span style="font-family:Bruno Ace,sans-serif;font-size:12px;color:rgba(255,255,255,0.6);">' + user.email + '</span>' +
    accountStatus;

  drawerNav.appendChild(li);
};

var showAuthenticatedState = function () {
  if (!user) return;

  var authFrame = document.querySelector('.auth_frame');
  if (!authFrame) return;

  var avatarHtml = '';
  if (user.picture) {
    avatarHtml = '<img src="' + user.picture + '" alt="avatar" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">';
  }

  var authBody = authFrame.querySelector('.auth_card_body');
  var googleFrame = authBody.querySelector('.google_button_frame');
  var startText = authBody.querySelector('.start_trial_journey_text');
  var orFrame = authBody.querySelector('.or_frame');
  var createBtn = authBody.querySelector('.create_account_frame');

  if (googleFrame) {
    googleFrame.innerHTML = avatarHtml + '<p>' + user.name + '</p>';
  }
  if (startText) {
    startText.textContent = user.email;
  }
  if (orFrame) {
    orFrame.style.display = 'none';
  }
  if (createBtn) {
    if (localStorage.getItem('account_created') === 'true') {
      createBtn.textContent = 'Account created';
      createBtn.style.borderColor = 'rgba(46,139,87,1)';
      createBtn.style.color = 'rgba(46,139,87,1)';
      createBtn.style.cursor = 'default';
      createBtn.disabled = true;
    } else {
      createBtn.addEventListener('click', function () {
        localStorage.setItem('account_created', 'true');
        createBtn.textContent = 'Account created';
        createBtn.style.borderColor = 'rgba(46,139,87,1)';
        createBtn.style.color = 'rgba(46,139,87,1)';
        createBtn.style.cursor = 'default';
        createBtn.disabled = true;
        updateDrawer();
      });
    }
  }

  var logoutBtn = document.createElement('button');
  logoutBtn.textContent = 'Logout';
  logoutBtn.className = 'logout_btn';
  logoutBtn.style.cssText = 'width:100%;height:48px;background:white;border:1px solid rgba(0,0,0,0.1);color:rgba(39,0,91,1);font-family:Bruno Ace,sans-serif;font-size:14px;cursor:pointer;border-radius:4px;margin-top:12px;';

  var mainFrame = authBody.querySelector('.google_auth_main_frame');
  if (mainFrame) {
    mainFrame.appendChild(logoutBtn);
  }

  logoutBtn.addEventListener('click', function () {
    clearUser();
    location.reload();
  });

  updateDrawer();
};

var showNotAuthenticatedMessage = function () {
  var btn = document.querySelector('.create_account_frame');
  if (!btn) return;

  var original = btn.textContent;
  btn.textContent = 'Sign in with Google first';
  btn.style.opacity = '0.5';
  btn.style.cursor = 'default';

  setTimeout(function () {
    btn.textContent = original;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  }, 2000);
};

var initAuthUI = function () {
  var googleBtn = document.querySelector('.google_button_frame');
  var signInBtn = document.querySelector('.sign_in_button_frame button');
  var emailBtn = document.querySelector('.email_button_frame button');
  var createAccountBtn = document.querySelector('.create_account_frame');

  if (user) {
    showAuthenticatedState();
    return;
  }

  if (googleBtn) {
    googleBtn.style.cursor = 'pointer';
    googleBtn.addEventListener('click', function () {
      window.location.href = BACKEND_URL + '/auth/google?redirect=' + encodeURIComponent(window.location.href);
    });
  }

  if (signInBtn) {
    signInBtn.addEventListener('click', function () {
      window.location.href = BACKEND_URL + '/auth/google?redirect=' + encodeURIComponent(window.location.href);
    });
  }

  if (emailBtn) {
    emailBtn.addEventListener('click', function () {
      window.location.href = BACKEND_URL + '/auth/google?redirect=' + encodeURIComponent(window.location.href);
    });
  }

  if (createAccountBtn) {
    createAccountBtn.addEventListener('click', function () {
      showNotAuthenticatedMessage();
    });
  }
};

loadUser();
parseCallbackParams();
initAuthUI();