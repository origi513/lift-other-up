// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyC0mgHM9WE_MJq5W_qr4_wYDDkNnm5wPxQ",
    authDomain: "lift-other-up-prod.firebaseapp.com",
    projectId: "lift-other-up-prod",
    storageBucket: "lift-other-up-prod.firebasestorage.app",
    messagingSenderId: "829627301087",
    appId: "1:829627301087:web:ed3d9a6c82fcd2e9765c97"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Global State
let currentUser = null;
let userProfile = null;
let currentView = 'dashboard';
let currentMood = null;
let currentCategory = null;
let currentRecognitionCategory = null;

// ===== UI Constants =====
const moods = [
    { emoji: '✨', label: 'Excited' },
    { emoji: '😌', label: 'Happy' },
    { emoji: '🤔', label: 'Neutral' },
    { emoji: '😩', label: 'Tired' },
    { emoji: '😓', label: 'Stressed' },
    { emoji: '😔', label: 'Sad' },
    { emoji: '😰', label: 'Anxious' },
    { emoji: '🙏', label: 'Grateful' }
];

const reflectionCategories = ['academic', 'spiritual', 'mental', 'emotional', 'personal'];
const recognitionCategories = ['Teamwork', 'Empathy', 'Leadership', 'Resilience', 'Kindness', 'Academic Help'];

// ===== DOM Elements =====
const loadingScreen = document.getElementById('loading-screen');
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');

// ===== Event Listeners =====
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    checkAuthStatus();
});

function initializeEventListeners() {
    // Login
    document.getElementById('google-auth-btn').addEventListener('click', googleSignIn);
    document.getElementById('sign-in-btn').addEventListener('click', emailSignIn);
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = btn.dataset.view;
            switchView(view);
        });
    });
    
    document.querySelectorAll('[data-view]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (btn.dataset.view) {
                switchView(btn.dataset.view);
            }
        });
    });

    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = btn.dataset.back;
            resetCheckInForm();
            switchView(view);
        });
    });
    
    // Goal buttons
    document.querySelectorAll('.goal-btn').forEach(btn => {
        btn.addEventListener('click', toggleGoal);
    });
    
    // Persona buttons
    document.querySelectorAll('.persona-btn').forEach(btn => {
        btn.addEventListener('click', selectPersona);
    });
    
    // Check-in mood selection
    document.querySelectorAll('#checkin-view .mood-btn').forEach(btn => {
        btn.addEventListener('click', selectCheckInMood);
    });
    
    // Check-in submit
    document.getElementById('submit-checkin-btn').addEventListener('click', submitCheckIn);
    
    // Reflection category
    document.querySelectorAll('#reflection-view .category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            selectReflectionCategory(btn);
        });
    });
    
    document.getElementById('submit-reflection-btn').addEventListener('click', submitReflection);
    
    // Recognition category
    document.querySelectorAll('#recognition-view .category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            selectRecognitionCategory(btn);
        });
    });
    
    document.getElementById('send-recognition-btn').addEventListener('click', sendRecognition);
}

// ===== Authentication =====
function checkAuthStatus() {
    showScreen('loading');
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            loadUserProfile();
        } else {
            currentUser = null;
            userProfile = null;
            showScreen('login');
        }
    });
}

function googleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .catch(error => {
            console.error('Auth Error:', error);
            alert('Sign in failed: ' + error.message);
        });
}

function emailSignIn() {
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    
    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            console.error('Auth Error:', error);
            alert('Sign in failed: ' + error.message);
        });
}

function logout() {
    auth.signOut().then(() => {
        currentUser = null;
        userProfile = null;
        showScreen('login');
    });
}

function loadUserProfile() {
    const userDoc = db.collection('users').doc(currentUser.uid);
    userDoc.get().then((doc) => {
        if (doc.exists) {
            userProfile = doc.data();
            showScreen('main');
            updateDashboard();
        } else {
            // Create new user profile
            const newProfile = {
                uid: currentUser.uid,
                name: currentUser.displayName || 'Student',
                email: currentUser.email || '',
                role: 'student',
                streak: 0,
                totalRecognitions: 0,
                createdAt: new Date(),
                goals: { study: false, exercise: false, sleep: false }
            };
            userDoc.set(newProfile).then(() => {
                userProfile = newProfile;
                showScreen('main');
                updateDashboard();
            });
        }
    }).catch(error => {
        console.error('Error loading profile:', error);
        alert('Error loading profile');
    });
}

// ===== Screen Management =====
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    if (screenName === 'loading') {
        loadingScreen.classList.add('active');
    } else if (screenName === 'login') {
        loginScreen.classList.add('active');
    } else if (screenName === 'main') {
        mainApp.classList.add('active');
    }
}

function switchView(view) {
    currentView = view;
    
    // Hide all views
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
    });
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === view) {
            btn.classList.add('active');
        }
    });
    
    // Show current view
    const viewElement = document.getElementById(view + '-view');
    if (viewElement) {
        viewElement.classList.add('active');
    }
    
    // Load view-specific data
    if (view === 'feed') {
        loadFeed();
    } else if (view === 'dashboard') {
        updateDashboard();
    }
}

// ===== Dashboard =====
function updateDashboard() {
    if (!userProfile) return;
    
    document.getElementById('greeting-user').textContent = `Hi, ${userProfile.name}! 👋`;
    document.getElementById('streak-value').textContent = userProfile.streak || 0;
    document.getElementById('kudos-value').textContent = userProfile.totalRecognitions || 0;
    
    // Update persona emoji
    const personaMap = {
        'owl': '🦉',
        'lion': '🦁',
        'dolphin': '🐬',
        'fox': '🦊'
    };
    document.getElementById('persona-emoji').textContent = personaMap[userProfile.persona] || '👤';
    
    // Show persona section if not selected
    const personaSection = document.getElementById('persona-section');
    if (!userProfile.persona) {
        personaSection.classList.remove('hidden');
    } else {
        personaSection.classList.add('hidden');
    }
    
    // Update goal buttons
    updateGoalButtons();
}

function updateGoalButtons() {
    document.querySelectorAll('.goal-btn').forEach(btn => {
        const goal = btn.dataset.goal;
        if (userProfile.goals && userProfile.goals[goal]) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function toggleGoal(e) {
    const goal = e.target.closest('.goal-btn').dataset.goal;
    const newGoals = {
        ...userProfile.goals,
        [goal]: !userProfile.goals[goal]
    };
    
    db.collection('users').doc(currentUser.uid).update({ goals: newGoals })
        .then(() => {
            userProfile.goals = newGoals;
            updateGoalButtons();
        })
        .catch(error => console.error('Error updating goals:', error));
}

function selectPersona(e) {
    const persona = e.target.closest('.persona-btn').dataset.persona;
    db.collection('users').doc(currentUser.uid).update({ persona })
        .then(() => {
            userProfile.persona = persona;
            updateDashboard();
        })
        .catch(error => console.error('Error updating persona:', error));
}

// ===== Check-in =====
function selectCheckInMood(e) {
    const btn = e.target.closest('.mood-btn');
    currentMood = btn.dataset.mood;
    
    document.querySelectorAll('#checkin-view .mood-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Move to reason step
    document.getElementById('checkin-mood').classList.remove('active');
    document.getElementById('checkin-reason').classList.add('active');
}

function resetCheckInForm() {
    currentMood = null;
    document.getElementById('reason-input').value = '';
    document.getElementById('feedback-content').innerHTML = '';
    
    document.querySelectorAll('#checkin-view .mood-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('checkin-mood').classList.add('active');
    document.getElementById('checkin-reason').classList.remove('active');
    document.getElementById('checkin-feedback').classList.remove('active');
}

async function submitCheckIn() {
    const reason = document.getElementById('reason-input').value;
    if (!currentMood || !reason) {
        alert('Please select a mood and enter a reason');
        return;
    }
    
    const btn = document.getElementById('submit-checkin-btn');
    btn.disabled = true;
    btn.textContent = 'Getting Feedback...';
    
    try {
        const feedback = await getCheckInFeedback(currentMood, reason);
        document.getElementById('feedback-content').textContent = feedback;
        
        // Save to database
        db.collection('checkins').add({
            userId: currentUser.uid,
            mood: currentMood,
            reason: reason,
            aiFeedback: feedback,
            createdAt: new Date()
        });
        
        // Move to feedback step
        document.getElementById('checkin-reason').classList.remove('active');
        document.getElementById('checkin-feedback').classList.add('active');
    } catch (error) {
        console.error('Error getting feedback:', error);
        alert('Error getting feedback');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Get Feedback';
    }
}

// ===== Reflection =====
function selectReflectionCategory(btn) {
    currentCategory = btn.dataset.category;
    document.querySelectorAll('#reflection-view .category-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

async function submitReflection() {
    if (!currentCategory) {
        alert('Please select a category');
        return;
    }
    
    const content = document.getElementById('reflection-input').value;
    if (!content) {
        alert('Please enter your reflection');
        return;
    }
    
    const btn = document.getElementById('submit-reflection-btn');
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    
    try {
        const feedback = await getReflectionFeedback(currentCategory, content);
        
        // Save to database
        db.collection('reflections').add({
            userId: currentUser.uid,
            category: currentCategory,
            content: content,
            aiFeedback: feedback,
            createdAt: new Date()
        });
        
        // Show feedback
        document.getElementById('reflection-feedback-content').textContent = feedback;
        document.getElementById('reflection-feedback').classList.remove('hidden');
    } catch (error) {
        console.error('Error:', error);
        alert('Error submitting reflection');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Submit Reflection';
    }
}

// ===== Recognition =====
function selectRecognitionCategory(btn) {
    currentRecognitionCategory = btn.dataset.category;
    document.querySelectorAll('#recognition-view .category-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

async function sendRecognition() {
    const receiverName = document.getElementById('receiver-name').value;
    const message = document.getElementById('recognition-message').value;
    const isAnonymous = document.getElementById('anonymous-checkbox').checked;
    
    if (!receiverName || !currentRecognitionCategory || !message) {
        alert('Please fill in all fields');
        return;
    }
    
    const btn = document.getElementById('send-recognition-btn');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    
    try {
        db.collection('recognitions').add({
            senderId: currentUser.uid,
            senderName: isAnonymous ? 'Anonymous' : userProfile.name,
            receiverName: receiverName,
            category: currentRecognitionCategory,
            message: message,
            isAnonymous: isAnonymous,
            createdAt: new Date()
        });
        
        // Update user's recognition count
        db.collection('users').doc(currentUser.uid).update({
            totalRecognitions: firebase.firestore.FieldValue.increment(1)
        });
        
        // Show success
        document.getElementById('recognition-form').classList.add('hidden');
        document.getElementById('recognition-success').classList.remove('hidden');
        
        // Reset form after 2 seconds
        setTimeout(() => {
            resetRecognitionForm();
        }, 2000);
    } catch (error) {
        console.error('Error:', error);
        alert('Error sending recognition');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Send Recognition';
    }
}

function resetRecognitionForm() {
    document.getElementById('receiver-name').value = '';
    document.getElementById('recognition-message').value = '';
    document.getElementById('anonymous-checkbox').checked = false;
    currentRecognitionCategory = null;
    
    document.querySelectorAll('#recognition-view .category-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('recognition-form').classList.remove('hidden');
    document.getElementById('recognition-success').classList.add('hidden');
}

// ===== Feed =====
function loadFeed() {
    const feedPosts = document.getElementById('feed-posts');
    feedPosts.innerHTML = '<div class="loading">Loading feed...</div>';
    
    db.collection('recognitions')
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            if (snapshot.empty) {
                feedPosts.innerHTML = '<div class="empty-state">No recognitions yet. Be the first to give one!</div>';
                return;
            }
            
            feedPosts.innerHTML = '';
            snapshot.forEach((doc) => {
                const post = doc.data();
                const feedPost = createFeedPostElement(post);
                feedPosts.appendChild(feedPost);
            });
        }, (error) => {
            console.error('Error loading feed:', error);
            feedPosts.innerHTML = '<div class="empty-state">Error loading feed</div>';
        });
}

function createFeedPostElement(post) {
    const div = document.createElement('div');
    div.className = 'feed-post';
    
    const date = post.createdAt ? post.createdAt.toDate().toLocaleDateString() : 'Today';
    
    div.innerHTML = `
        <div class="feed-post-header">
            <div class="feed-post-user">
                <div class="feed-avatar">${post.senderName.charAt(0).toUpperCase()}</div>
                <div class="feed-user-info">
                    <div class="feed-user-name">${post.senderName} ➔ ${post.receiverName}</div>
                    <div class="feed-category">${post.category}</div>
                </div>
            </div>
            <div class="feed-date">${date}</div>
        </div>
        <div class="feed-message">"${post.message}"</div>
    `;
    
    return div;
}

// ===== AI Feedback Functions =====
async function getCheckInFeedback(mood, reason) {
    try {
        const apiKey = 'AIzaSyDyWRPLjI9EuJT_HvNQMzLfFKZwHm-1pZY'; // Replace with your actual API key
        const prompt = `You are a compassionate mentor and therapeutic coach for a 14-16 year old student.
The student is currently feeling "${mood}" because: "${reason}".

Provide a response that:
1. Validates their feeling without judgment.
2. Offers a small, actionable piece of "micro-advice" or a gentle perspective shift.
3. Ends with a warm, encouraging closing.

Keep the tone supportive, informal but respectful, and concise (max 3 sentences). Avoid generic platitudes.`;

        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text || "I'm here for you. Thank you for sharing that with me.";
    } catch (error) {
        console.error('Error getting feedback:', error);
        return "Thank you for sharing your feelings. Remember that it's okay to feel exactly how you do right now.";
    }
}

async function getReflectionFeedback(category, content) {
    try {
        const apiKey = 'AIzaSyDyWRPLjI9EuJT_HvNQMzLfFKZwHm-1pZY'; // Replace with your actual API key
        const prompt = `The user reflected on their ${category} growth: "${content}". 
Provide a warm, supportive, and age-appropriate (14-16 years old) therapeutic response. 
Encourage their self-awareness and growth. Keep it concise (2-3 sentences).`;

        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text || "Great reflection! Self-awareness is the first step to growth.";
    } catch (error) {
        console.error('Error getting reflection feedback:', error);
        return "Great reflection! Self-awareness is the first step to growth.";
    }
}
