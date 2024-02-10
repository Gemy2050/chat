import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js";
import {
  getStorage,
  ref,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  doc,
  arrayUnion,
  deleteDoc,
  onSnapshot,
  orderBy,
} from "https://www.gstatic.com/firebasejs/9.8.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBp8VDM0i3MRj3ubLXGtFEh_OfMdt4b1_Y",
  authDomain: "firstproject-ee3fe.firebaseapp.com",
  projectId: "firstproject-ee3fe",
  storageBucket: "firstproject-ee3fe.appspot.com",
  messagingSenderId: "427355085094",
  appId: "1:427355085094:web:82916109a1ae5f5518c9e7",
};

firebase.initializeApp(firebaseConfig);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// * --------------------------------------------------------------
// * --------------------------------------------------------------

let homePage = document.querySelector(".home");
let loginPage = document.querySelector(".loginForm");
let registerPage = document.querySelector(".registerForm");
let chatsPage = document.querySelector(".chats");
let userChatPage = document.querySelector(".user-chat");

let searchInput = document.getElementById("searchUser");

let chatID = "";

activeScreen(registerPage);

if (localStorage.getItem("currentUser")) {
  activeScreen(chatsPage);
  handleHomePage();
}

if (sessionStorage.getItem("otherUserId")) {
  activeScreen(userChatPage);
  chat();

  let userData = JSON.parse(sessionStorage.getItem("otherUser"));
  document.querySelector(
    ".user-chat .head .username"
  ).innerHTML = `${userData.name}`;
  document.querySelector(".user-chat .head img").src = userData.photoURL;
}

document.querySelector(".registerForm .route span").onclick = () => {
  activeScreen(loginPage);
};
document.querySelector(".loginForm .route span").onclick = () => {
  activeScreen(registerPage);
};

searchInput.oninput = (e) => {
  document.querySelector(".search-result").innerHTML = "";
  document
    .querySelector(".search-result")
    .style.setProperty("display", "none", "important");
};
document.querySelector(".logout").onclick = (e) => {
  localStorage.removeItem("currentUser");
  activeScreen(loginPage);
};

// //* Handle Click On user
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("user")) {
    chatID = e.target.dataset.id;
    sessionStorage.setItem("otherUserId", chatID);
    activeScreen(userChatPage);
    document
      .querySelector(".search-result")
      .style.setProperty("display", "none", "important");
    searchInput.value = "";
    chat();
  } else if (e.target.classList.contains("back")) {
    activeScreen(chatsPage);
    sessionStorage.removeItem("otherUserId");
    sessionStorage.removeItem("otherUser");
  }
});

document.querySelector("button.register").onclick = register;
document.querySelector("button.login").onclick = login;
document.querySelector(".search button").onclick = search;

document.querySelector(".eye").onclick = function () {
  let input = document.querySelector("input.pass");
  if (input.getAttribute("type") == "text") {
    input.type = "password";
    this.classList.remove("active");
  } else {
    input.type = "text";
    this.classList.add("active");
  }
};

document.querySelector("button.send").onclick = sendMessage;
async function sendMessage() {
  let MessageInput = document.querySelector(".message-input");
  if (["", " "].includes(MessageInput.value.trim())) return;

  const currentUserData = JSON.parse(localStorage.getItem("currentUser"));
  const { password, ...currentUser } = currentUserData;
  let otherUser = JSON.parse(sessionStorage.getItem("otherUser"));

  let lastMessage = MessageInput.value;

  let combinedId =
    currentUser.id > otherUser.id
      ? `${currentUser.id}` + `${otherUser.id}`
      : `${otherUser.id}` + `${currentUser.id}`;

  let dateNow = new Date();
  let hours = new Date().getHours();
  let period = "am";
  if (hours > 12) {
    period = "pm";
    hours -= 12;
  }

  let time =
    `${hours}:`.padStart(3, "0") +
    `${dateNow.getMinutes()}`.padStart(2, "0") +
    " " +
    period;

  try {
    let ChatsDoc = await getDoc(doc(db, "chats", combinedId));
    // Check if there is a chat between the two users

    if (!ChatsDoc.exists()) {
      // Create new chat and add it to both users' chats collection
      await setDoc(doc(db, "chats", combinedId), {
        messages: [
          {
            message: MessageInput.value,
            time: time,
            id: dateNow.getTime(),
            senderId: currentUser.id,
            photoURL: currentUser.photoURL,
          },
        ],
      });
    } else {
      await updateDoc(doc(db, "chats", `${combinedId}`), {
        messages: arrayUnion({
          message: MessageInput.value,
          time: time,
          id: dateNow.getTime(),
          senderId: currentUser.id,
          photoURL: currentUser.photoURL,
        }),
      });
    }
    MessageInput.value = "";
    document.querySelector("#sendSound").play();

    let userChatDoc = await getDoc(doc(db, "userChats", `${currentUser.id}`));
    let otherUserChatDoc = await getDoc(
      doc(db, "userChats", `${otherUser.id}`)
    );

    if (userChatDoc.exists()) {
      await updateDoc(doc(db, "userChats", `${currentUser.id}`), {
        [combinedId]: {
          userInfo: { ...otherUser },
          lastMessage: {
            message: lastMessage,
            time: time,
            id: dateNow.getTime(),
          },
        },
      });
    } else {
      await setDoc(doc(db, "userChats", `${currentUser.id}`), {
        [combinedId]: {
          userInfo: { ...otherUser },
          lastMessage: {
            message: lastMessage,
            time: time,
            id: dateNow.getTime(),
          },
        },
      });
    }

    if (otherUserChatDoc.exists()) {
      await updateDoc(doc(db, "userChats", `${otherUser.id}`), {
        [combinedId]: {
          userInfo: { ...currentUser },
          lastMessage: {
            message: lastMessage,
            time: time,
            id: dateNow.getTime(),
          },
        },
      });
    } else {
      await setDoc(doc(db, "userChats", `${otherUser.id}`), {
        [combinedId]: {
          userInfo: { ...currentUser },
          lastMessage: {
            message: lastMessage,
            time: time,
            id: dateNow.getTime(),
          },
        },
      });
    }
    console.log("Storing Finished");
  } catch (error) {
    new swal("Server Error", "", "error");
    console.log(error.message);
  }
}
async function chat() {
  const otherUserId = sessionStorage.getItem("otherUserId");
  const currentUserId = JSON.parse(localStorage.getItem("currentUser")).id + "";
  const messagesContainer = document.querySelector(".messages");

  messagesContainer.innerHTML = "";

  try {
    let userDoc = await getDoc(doc(db, "users", otherUserId));
    let userData = await userDoc.data();
    let { password, ...otherUser } = userData;

    sessionStorage.setItem("otherUser", JSON.stringify(otherUser));

    let combinedId =
      currentUserId > userData.id
        ? currentUserId + otherUserId
        : otherUserId + currentUserId;

    document.querySelector(
      ".user-chat .head .username"
    ).innerHTML = `${userData.name}`;
    document.querySelector(".user-chat .head img").src = userData.photoURL;

    const unsubscribe = onSnapshot(doc(db, "chats", combinedId), (doc) => {
      if (!doc.exists()) {
        return;
      }

      messagesContainer.innerHTML = "";
      doc.data().messages.forEach((message) => {
        messagesContainer.innerHTML += `
          <div class="message ${
            message.senderId == currentUserId ? "outgoing" : "incoming"
          }">
            <div class="info">
              <img src="${message.photoURL}" alt="">
              <span class="time d-block text-muted">${message.time}</span>
            </div>
            <p class="m-0 content">${message.message}</p>
        </div>
        `;
      });

      Array.from(document.querySelectorAll(".messages .message"))
        .at(-1)
        .scrollIntoView({ behavior: "smooth" });
    });
  } catch (error) {
    console.log(error.message);
    new swal("Server Error", "", "error");
  }
}

async function search(e) {
  if (["", " ", null].includes(searchInput.value.trim())) return;

  e.target.classList.add("disabled");
  try {
    let searchValue = searchInput.value.toLowerCase();

    const q = query(collection(db, "users"), where("name", "==", searchValue));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs;

    let user = data[0].data();

    document.querySelector(".search-result").innerHTML = `
      <p class="search-message text-muted">search result:</p>
        <div class="user d-flex align-items-center gap-2 text-capitalize" data-id='${user.id}'>
          <img src="${user.photoURL}" alt="avatar">
          <div class="info flex-grow-1">
            <div class="top w-100 d-flex gap-2 justify-content-between">
              <h5 class="name m-0">${user.name}</h5>
            </div>
          </div>
        </div>
    `;

    e.target.classList.remove("disabled");
  } catch (error) {
    // new swal(error.message, "", "error");
    document.querySelector(
      ".search-result"
    ).innerHTML = `<p class="search-message text-muted">Not Found</p>`;
    e.target.classList.remove("disabled");
  }
  document
    .querySelector(".search-result")
    .style.setProperty("display", "block", "important");
}

async function login(e) {
  e.preventDefault();
  const email = document.querySelector("#email-login").value;
  const password = document.querySelector("#password-login").value;

  try {
    e.target.classList.add("disabled");
    // Check if The user exist
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs;

    let user = data[0].data();

    if (!user) {
      new swal("email is wrong", "", "error");
      e.target.classList.add("disabled");
      return;
    }

    if (password === user.password) {
      localStorage.setItem("currentUser", JSON.stringify(user));
      handleHomePage();
      activeScreen(chatsPage);
      homePage.classList.add("hide");
      e.target.classList.add("disabled");
    } else {
      new swal("password is wrong", "", "error");
      e.target.classList.add("disabled");
      return;
    }
  } catch (error) {
    new swal("Something went wrong", "", "error");
    e.target.classList.add("disabled");
  }
}

function handleHomePage() {
  let usersContainer = document.querySelector(".chats .users");
  let user = JSON.parse(localStorage.getItem("currentUser"));
  document.querySelector(".chats .head img").src = user.photoURL;
  document.querySelector(".chats .head .username").textContent = user.name;

  let counter = 0;
  const unsubscribe = onSnapshot(doc(db, "userChats", `${user.id}`), (doc) => {
    if (!doc.exists()) {
      return;
    }

    counter++;

    if (counter > 1) {
      document.querySelector("#notification").play();
    }

    usersContainer.innerHTML = "";
    let users = doc.data();
    for (let user in users) {
      let { message, time } = users[user].lastMessage;
      let { photoURL, name, id } = users[user].userInfo;

      usersContainer.innerHTML += `
        <div class="user d-flex align-items-center gap-2 border-bottom" data-id="${id}">
          <img src="${photoURL}" alt="avatar">
          <div class="info flex-grow-1">
            <div class="top w-100 d-flex gap-2 justify-content-between">
              <h5 class="name m-0 text-capitalize">${name}</h5>
              <span class="time text-muted">${time}</span>
            </div>
            <p class="message m-0 text-muted">${message}</p>
          </div>
        </div>
      `;
    }
  });
}

async function register(e) {
  e.preventDefault();

  const firstName = document.getElementById("firstName").value.toLowerCase();
  const lastName = document.getElementById("lastName").value.toLowerCase();
  const email = document.getElementById("email-register").value;
  const password = document.getElementById("password-register").value;
  const image = document.getElementById("image").files[0];

  let fullName = `${firstName} ${lastName}`;

  if (
    firstName == "" ||
    lastName == "" ||
    email == "" ||
    password == "" ||
    !image
  ) {
    new swal("Please, fill  all fields!", "", "warning");
    return false;
  }

  try {
    e.target.classList.add("disabled");
    // Check if The user exist
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs;

    if (data[0]) {
      new swal("User already exists! Please login instead.", "", "warning");
      activeScreen(loginPage);
      return;
    }

    // User not found so create a new one

    await uploadData(fullName, email, password);
  } catch (error) {
    console.log("Error creating user: ", error.message);
    new swal("Server Error", "", "error");
  }
}

async function uploadData(fullName, email, password) {
  let userID = Date.now();

  let file = document.getElementById("image").files[0];
  var storageRef = firebase.storage().ref();
  var imageRef = storageRef.child("avatars/" + fullName + userID);

  // Upload file to Firebase Storage
  var uploadTask = imageRef.put(file);

  // Monitor the upload progress
  uploadTask.on(
    "state_changed",
    function (snapshot) {
      // You can track the progress here if needed
    },
    function (error) {
      // Handle unsuccessful upload
      console.error("Error uploading image:", error);
    },
    function () {
      // Handle successful upload
      // Retrieve the image URL
      uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
        let currentUser = {
          id: userID,
          name: fullName,
          photoURL: downloadURL,
          email: email,
          password: password,
        };

        setDoc(doc(db, "users", `${userID}`), currentUser);

        new swal("Account Created Successfully!", "", "success");
        document.querySelector(".register").classList.remove("disabled");
        activeScreen(homePage);

        return downloadURL;
      });
    }
  );
}

function activeScreen(page) {
  if (
    page.classList.contains("loginForm") ||
    page.classList.contains("registerForm")
  ) {
    homePage.classList.remove("hide");
  } else {
    homePage.classList.add("hide");
  }

  [loginPage, registerPage, chatsPage, userChatPage].forEach((el) => {
    el.classList.add("hide");
  });

  page.classList.remove("hide");
}
