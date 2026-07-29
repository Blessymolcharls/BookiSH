let currentRole = '';
let currentTab = 'signin'; // 'signin' or 'signup'

// Clear all local storage / session storage when the login page loads (handles logout)
localStorage.clear();
sessionStorage.clear();

window.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  if (form) form.reset();
});

function toggleRole() {
  const role = document.getElementById('loginRole').value;
  currentRole = role;
  
  if (role === 'Student') {
    document.getElementById('studentTabs').classList.remove('hidden');
    switchTab('signin');
  } else if (role === 'Admin') {
    document.getElementById('studentTabs').classList.add('hidden');
    document.getElementById('signUpSection').classList.add('hidden');
    document.getElementById('signInSection').classList.remove('hidden');
    
    document.getElementById('adminUsernameField').classList.remove('hidden');
    document.getElementById('studentIdField').classList.add('hidden');
  } else {
    document.getElementById('studentTabs').classList.add('hidden');
    document.getElementById('signInSection').classList.add('hidden');
    document.getElementById('signUpSection').classList.add('hidden');
  }
}

function switchTab(tab) {
  currentTab = tab;
  
  const tabSignIn = document.getElementById('tabSignIn');
  const tabSignUp = document.getElementById('tabSignUp');
  
  if (tab === 'signin') {
    document.getElementById('signUpSection').classList.add('hidden');
    document.getElementById('signInSection').classList.remove('hidden');
    
    document.getElementById('studentIdField').classList.remove('hidden');
    document.getElementById('adminUsernameField').classList.add('hidden');
    
    tabSignIn.classList.replace('border-transparent', 'border-[#d1a85b]');
    tabSignIn.classList.replace('text-secondary', 'text-[#d1a85b]');
    
    tabSignUp.classList.replace('border-[#d1a85b]', 'border-transparent');
    tabSignUp.classList.replace('text-[#d1a85b]', 'text-secondary');
  } else {
    document.getElementById('signInSection').classList.add('hidden');
    document.getElementById('signUpSection').classList.remove('hidden');
    
    tabSignUp.classList.replace('border-transparent', 'border-[#d1a85b]');
    tabSignUp.classList.replace('text-secondary', 'text-[#d1a85b]');
    
    tabSignIn.classList.replace('border-[#d1a85b]', 'border-transparent');
    tabSignIn.classList.replace('text-[#d1a85b]', 'text-secondary');
  }
}

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
}

function clearError(fieldId) {
  const el = document.getElementById(fieldId);
  const errEl = document.getElementById('err-' + fieldId);
  el.classList.remove('border-red-500');
  errEl.classList.add('hidden');
}

function showErrorMsg(fieldId, msg) {
  const el = document.getElementById(fieldId);
  const errEl = document.getElementById('err-' + fieldId);
  el.classList.add('border-red-500');
  errEl.innerHTML = '❌ ' + msg;
  errEl.classList.remove('hidden');
}

function validateSignUp() {
  const name = document.getElementById('regName').value.trim();
  const studentId = document.getElementById('regStudentId').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const dept = document.getElementById('regDepartment').value.trim();
  const year = document.getElementById('regYear').value.trim();
  const pass = document.getElementById('regPassword').value;
  const passConfirm = document.getElementById('regConfirmPassword').value;

  let isValid = true;
  
  clearError('regName');
  if (name.length < 3) {
    if (name.length > 0) showErrorMsg('regName', 'Name must be at least 3 characters');
    isValid = false;
  }
  
  clearError('regStudentId');
  if (!/^[a-zA-Z0-9]+$/.test(studentId) || studentId.length === 0) {
    if (studentId.length > 0) showErrorMsg('regStudentId', 'Alphanumeric only');
    isValid = false;
  }

  clearError('regEmail');
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length === 0) {
    if (email.length > 0) showErrorMsg('regEmail', 'Invalid email address');
    isValid = false;
  }
  
  clearError('regDepartment');
  if (dept.length === 0) isValid = false;

  clearError('regYear');
  if (year.length === 0) isValid = false;

  clearError('regPassword');
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passRegex.test(pass)) {
    if (pass.length > 0) showErrorMsg('regPassword', '8+ chars, upper, lower, number, special');
    isValid = false;
  }

  clearError('regConfirmPassword');
  if (pass !== passConfirm) {
    if (passConfirm.length > 0) showErrorMsg('regConfirmPassword', 'Passwords do not match');
    isValid = false;
  }

  const btn = document.getElementById('btnSignUp');
  if (isValid) {
    btn.disabled = false;
    btn.classList.remove('opacity-50', 'cursor-not-allowed');
  } else {
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
  }
  return isValid;
}

function handleSignUp() {
  if (!validateSignUp()) return;

  const btn = document.getElementById('btnSignUp');
  const txt = document.getElementById('txtSignUp');
  const spin = document.getElementById('spinSignUp');

  if (btn.disabled) return;

  btn.disabled = true;
  txt.classList.add('opacity-0');
  spin.classList.remove('hidden');

  const payload = {
    action: 'register_student',
    name: document.getElementById('regName').value.trim(),
    student_id: document.getElementById('regStudentId').value.trim(),
    email: document.getElementById('regEmail').value.trim(),
    department: document.getElementById('regDepartment').value.trim(),
    year: document.getElementById('regYear').value.trim(),
    password: document.getElementById('regPassword').value
  };

  fetch('/cgi-bin/c_program.cgi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(r => {
    return r.json().then(data => {
      if (!r.ok || (data.status && data.status !== 'Registration successful')) {
        throw data;
      }
      return data;
    });
  })
  .then(res => {
    showToast('Account created successfully. You can now sign in.', 'success');
    
    // Switch to sign in without prefilling
    setTimeout(() => {
        switchTab('signin');
    }, 1000);
  })
  .catch(err => {
    showError('Registration Failed', err.status || 'Email or Student ID might already exist.');
  })
  .finally(() => {
    btn.disabled = false;
    txt.classList.remove('opacity-0');
    spin.classList.add('hidden');
  });
}

function handleSignIn() {
  if (!currentRole) return;

  clearError('username');
  clearError('password');
  clearError('studentId');

  const payload = { action: 'login', role: currentRole };
  
  if (currentRole === 'Admin') {
    payload.username = document.getElementById('username').value.trim();
    payload.password = document.getElementById('password').value;
    if (!payload.username) return showErrorMsg('username', 'Required');
    if (!payload.password) return showErrorMsg('password', 'Required');
  } else {
    payload.student_id = document.getElementById('studentId').value.trim();
    payload.password = document.getElementById('password').value;
    if (!payload.student_id) return showErrorMsg('studentId', 'Required');
    if (!payload.password) return showErrorMsg('password', 'Required');
  }

  const btn = document.getElementById('btnSignIn');
  const txt = document.getElementById('txtSignIn');
  const spin = document.getElementById('spinSignIn');

  if (btn.disabled) return;

  btn.disabled = true;
  txt.classList.add('opacity-0');
  spin.classList.remove('hidden');

  fetch('/cgi-bin/c_program.cgi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(r => {
    return r.json().then(data => {
      if (!r.ok || (data.status && data.status !== 'Login Successful')) {
        throw data;
      }
      return data;
    });
  })
  .then(res => {
    showToast('Login successful!', 'success');
    
    localStorage.setItem('userRole', currentRole);
    if (currentRole === 'Student') {
      localStorage.setItem('studentName', res.student_name);
      localStorage.setItem('studentId', payload.student_id);
      window.location.href = 'available.html';
    } else {
      localStorage.setItem('username', payload.username);
      window.location.href = 'library.html';
    }
  })
  .catch(err => {
    if (err.status && err.status.includes('No account found')) {
      showErrorMsg('studentId', err.status);
      showError('Login Failed', err.status);
    } else if (err.status && err.status.includes('Incorrect password')) {
      showErrorMsg('password', err.status);
      showError('Login Failed', err.status);
    } else {
      showError('Login Failed', err.status || 'Invalid credentials. Please try again.');
    }
  })
  .finally(() => {
    btn.disabled = false;
    txt.classList.remove('opacity-0');
    spin.classList.add('hidden');
  });
}

// Call once on load to setup default state
toggleRole();
