import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js";
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
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/9.8.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBp8VDM0i3MRj3ubLXGtFEh_OfMdt4b1_Y",
  authDomain: "firstproject-ee3fe.firebaseapp.com",
  projectId: "firstproject-ee3fe",
  storageBucket: "firstproject-ee3fe.appspot.com",
  messagingSenderId: "427355085094",
  appId: "1:427355085094:web:82916109a1ae5f5518c9e7",
};

// firebase.initializeApp(firebaseConfig);
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
// * --------------------------------------------------------------
// * --------------------------------------------------------------
let currentUser = JSON.parse(localStorage.getItem("currentUser"));
let loader = document.querySelector(".loader");

window.onbeforeunload = function (e) {
  // e.preventDefault();

  if (currentUser) {
    updateDoc(doc(db, "users", `${currentUser.id}`), {
      online: false,
    }).then((x) => console.log("fullFilled", x));
  }

  return null;
};

window.onload = (e) => {
  loader.classList.add("hide");
  currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (currentUser) {
    activeScreen(chatsPage);
    unsnapUserChats ? unsnapUserChats() : null;
    // detectUserStatus();
    renderUserChats();
  }

  if (sessionStorage.getItem("otherUserId")) {
    let userData = JSON.parse(sessionStorage.getItem("otherUser"));
    document.querySelector(
      ".user-chat .head .username"
    ).innerHTML = `${userData.name}`;
    document.querySelector(".user-chat .head img").src = userData.photoURL;

    chat();
    activeScreen(userChatPage);
  }

  if (currentUser) {
    updateDoc(doc(db, "users", `${currentUser.id}`), {
      online: true,
    }).then(() => console.log("Window loaded"));
  }
};

document.addEventListener("visibilitychange", () => {
  try {
    if (document.visibilityState == "hidden" && currentUser) {
      if (currentUser) {
        updateDoc(doc(db, "users", `${currentUser.id}`), {
          online: false,
        }).then(() => console.log("become offline"));
      }
    } else {
      if (currentUser) {
        updateDoc(doc(db, "users", `${currentUser.id}`), {
          online: true,
        }).then(() => console.log("become online"));
      }
    }
  } catch (error) {
    console.log(error);
  }
});

let homePage = document.querySelector(".home");
let loginPage = document.querySelector(".loginForm");
let registerPage = document.querySelector(".registerForm");
let chatsPage = document.querySelector(".chats");
let userChatPage = document.querySelector(".user-chat");

let searchInput = document.getElementById("searchUser");

let chatID = "";
let unsubscribeChat;
let usersStatusList = [];
let unsnapUserStatus, unsnapUserChats;

document.querySelector(".registerForm .route span").onclick = () => {
  activeScreen(loginPage);
};
document.querySelector(".loginForm .route span").onclick = () => {
  activeScreen(registerPage);
};

searchInput.oninput = (e) => {
  document
    .querySelector(".search-box")
    .style.setProperty("display", "none", "important");
};
document.querySelector(".logout").onclick = (e) => {
  let currentUser = JSON.parse(localStorage.getItem("currentUser"));
  loader.classList.remove("hide");
  document.querySelector(".chats .users").innerHTML = "";
  document
    .querySelector(".search-box")
    .style.setProperty("display", "none", "important");
  document.querySelector(".search-message").innerHTML = "";
  document.querySelector("#searchUser").value = "";

  updateDoc(doc(db, "users", `${currentUser.id}`), {
    online: false,
  }).then(() => {
    loader.classList.add("hide");
    localStorage.removeItem("currentUser");
    sessionStorage.removeItem("chatUsers");
    loginPage.reset();
    registerPage.reset();
    activeScreen(loginPage);
  });
};

// //* Handle Click On user
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("user")) {
    chatID = e.target.dataset.id;
    sessionStorage.setItem("otherUserId", chatID);
    activeScreen(userChatPage);
    document
      .querySelector(".search-box")
      .style.setProperty("display", "none", "important");
    searchInput.value = "";

    count = 0;
    chat();
  } else if (e.target.classList.contains("back")) {
    try {
      unsubscribeChat();

      let combinedId = sessionStorage.getItem("combinedId");
      let currentUserId = JSON.parse(localStorage.getItem("currentUser")).id;

      sessionStorage.removeItem("otherUserId");
      sessionStorage.removeItem("otherUser");
      sessionStorage.removeItem("combinedId");

      await updateDoc(doc(db, "userChats", `${currentUserId}`), {
        [combinedId + ".lastMessage.seen"]: true,
      });

      activeScreen(chatsPage);
      document.querySelector(".message-input").value = "";
    } catch (error) {
      console.log("Error Message: ", error.message);
    }
  }
});

document.querySelector("button.register").onclick = register;
document.querySelector("button.login").onclick = login;
document.querySelector(".search button").onclick = search;

document.querySelectorAll(".eye").forEach((el) => {
  el.onclick = function () {
    let input = el.parentElement.parentElement.querySelector("input.pass");
    if (input.getAttribute("type") == "text") {
      input.type = "password";
      this.classList.remove("active");
    } else {
      input.type = "text";
      this.classList.add("active");
    }
  };
});

document.querySelector("button.send").onclick = sendMessage;

async function sendMessage() {
  let MessageInput = document.querySelector(".message-input");
  MessageInput.focus();
  if (["", " "].includes(MessageInput.value.trim())) return;

  const currentUserData = JSON.parse(localStorage.getItem("currentUser"));
  const { password, ...currentUser } = currentUserData;
  let otherUser = JSON.parse(sessionStorage.getItem("otherUser"));

  let lastMessageValue = MessageInput.value;

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
  } else if (hours == 12) {
    period = "pm";
  } else if (hours == 0) {
    hours += 12;
  }

  let time =
    `${hours}:` + `${dateNow.getMinutes()}`.padStart(2, "0") + " " + period;

  try {
    // Check if there is a chat between the two users

    //* let ChatsDoc = await getDoc(doc(db, "chats", combinedId));
    let chatUsers = JSON.parse(sessionStorage.getItem("chatUsers")) || [];
    let user = chatUsers.find((el) => {
      // console.log(el.userInfo.id == otherUser.id);
      return el.userInfo.id == otherUser.id;
    });

    //* if(!ChatsDoc.exists())
    if (!user) {
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
    MessageInput.focus();
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
            message: lastMessageValue,
            time: time,
            id: dateNow.getTime(),
            seen: true,
          },
        },
      });
    } else {
      await setDoc(doc(db, "userChats", `${currentUser.id}`), {
        [combinedId]: {
          userInfo: { ...otherUser },
          lastMessage: {
            message: lastMessageValue,
            time: time,
            id: dateNow.getTime(),
            seen: true,
          },
        },
      });
    }

    if (otherUserChatDoc.exists()) {
      await updateDoc(doc(db, "userChats", `${otherUser.id}`), {
        [combinedId]: {
          userInfo: { ...currentUser },
          lastMessage: {
            message: lastMessageValue,
            time: time,
            id: dateNow.getTime(),
            seen: false,
          },
        },
      });
    } else {
      await setDoc(doc(db, "userChats", `${otherUser.id}`), {
        [combinedId]: {
          userInfo: { ...currentUser },
          lastMessage: {
            message: lastMessageValue,
            time: time,
            id: dateNow.getTime(),
            seen: false,
          },
        },
      });
    }
    Array.from(document.querySelectorAll(".messages .message"))
      .at(-1)
      .scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    new swal("Server Error", "", "error");
    console.log(error);
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

    let combinedId =
      currentUserId > userData.id
        ? currentUserId + otherUserId
        : otherUserId + currentUserId;

    sessionStorage.setItem("otherUser", JSON.stringify(otherUser));
    sessionStorage.setItem("combinedId", combinedId);

    document.querySelector(
      ".user-chat .head .username"
    ).innerHTML = `${userData.name}`;
    document.querySelector(".user-chat .head img").src = userData.photoURL;

    let count = 0;

    unsubscribeChat = onSnapshot(
      doc(db, "chats", combinedId),
      async (docData) => {
        if (!docData.exists()) {
          return;
        }

        messagesContainer.innerHTML = "";

        let date;
        let dateElement;
        let messages = docData.data().messages;

        messages.forEach((message) => {
          let options = { day: "2-digit", month: "2-digit", year: "numeric" };
          let msgDate = new Date(message.id).toLocaleDateString(
            ["en-GB"],
            options
          );
          let today = new Date();
          let yesterday = new Date(new Date().setDate(today.getDate() - 1));

          if (date != msgDate) {
            if (today.toLocaleDateString(["en-GB"], options) == msgDate) {
              date = "Today";
            } else if (
              yesterday.toLocaleDateString(["en-GB"], options) == msgDate
            ) {
              date = "Yesterday";
            } else {
              date = msgDate;
            }

            dateElement = `<h6 class='date'>${date}</h6>`;
            date = msgDate;
          } else {
            dateElement = "";
          }

          messagesContainer.innerHTML += `
          ${dateElement}
          <div class="message ${
            message.senderId == currentUserId ? "outgoing" : "incoming"
          }">
            <div class="info">
              <img src="${message.photoURL}" alt="avatar" loading="lazy">
              <span class="time d-block text-muted">${message.time}</span>
            </div>
            <p class="m-0 content">${message.message}</p>
        </div>
        `;
        });

        let lastMessage = Array.from(
          document.querySelectorAll(".messages .message")
        ).at(-1);

        lastMessage.scrollIntoView({ behavior: "smooth" });

        if (messages.at(-1).senderId != currentUserId && ++count > 1) {
          document.querySelector("#chatSound").play();
        }
      }
    );

    let chatUser = JSON.parse(sessionStorage.getItem("chatUsers")) || [];
    if (chatUser.find((el) => el.userInfo.id == otherUserId)) {
      await updateDoc(doc(db, "userChats", `${currentUserId}`), {
        [combinedId + ".lastMessage.seen"]: true,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
}

async function search(e) {
  if (["", " ", null].includes(searchInput.value.trim().toLowerCase())) return;
  document.querySelector(".search-result").innerHTML = "";

  e.target.classList.add("disabled");
  try {
    let searchValue = searchInput.value.toLowerCase();

    const q = query(collection(db, "users"), where("name", "==", searchValue));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.filter((el) => el.id != currentUser.id);

    if (data.length == 0) {
      throw new Error("User Not Found");
    }

    data.forEach((el) => {
      let user = el.data();

      let { online } = usersStatusList.find((el) => el.id == user.id) || false;

      document.querySelector(".search-result").innerHTML += `
      <div class="user d-flex align-items-center gap-2 text-capitalize" online="${online}" data-id='${user.id}'>
        <div class="image">
          <img src="${user.photoURL}" alt="avatar">
        </div>
        <div class="info flex-grow-1">
          <div class="top w-100 d-flex gap-2 justify-content-between">
          <h6 class="name m-0">${user.name}</h6>
          </div>
        </div>
      </div>
      `;
    });

    document.querySelector(
      ".search-box .search-message"
    ).innerHTML = `Search Result:`;

    e.target.classList.remove("disabled");
  } catch (error) {
    console.log(error);
    document.querySelector(
      ".search-box .search-message"
    ).innerHTML = `Not Found`;
    e.target.classList.remove("disabled");
  }
  document
    .querySelector(".search-box")
    .style.setProperty("display", "block", "important");
}

async function login(e) {
  e.preventDefault();
  loader.classList.remove("hide");

  const email = document
    .querySelector("#email-login")
    .value.trim()
    .toLowerCase();
  const passwordValue = document.querySelector("#password-login").value;

  try {
    e.target.classList.add("disabled");
    // Check if The user exist
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs;

    let user = data[0]?.data();

    if (!user) {
      loader.classList.add("hide");
      new swal("email is wrong", "", "error");
      e.target.classList.remove("disabled");
      return;
    }

    let { password, ...userData } = user;

    if (passwordValue === user.password) {
      localStorage.setItem("currentUser", JSON.stringify(userData));

      updateDoc(doc(db, "users", `${userData.id}`), {
        online: true,
      });

      renderUserChats();
      activeScreen(chatsPage);
      homePage.classList.add("hide");
    } else {
      new swal("password is wrong", "", "error");
    }
    e.target.classList.remove("disabled");
  } catch (error) {
    console.log(error);
    new swal("Something went wrong", "", "error");
    e.target.classList.remove("disabled");
  }
  loader.classList.add("hide");
}

function handleHomePage() {
  try {
    unsnapUserChats();
    renderUserChats();
  } catch (error) {
    console.log(error);
    new swal(error.message, "", "error");
    console.log(error);
  }
}

function addUserChatsToPage(users) {
  if (!users) {
    return;
  }

  try {
    let usersContainer = document.querySelector(".chats .users");
    usersContainer.innerHTML = "";

    for (let user of users) {
      if (!user.lastMessage || !user.userInfo) {
        continue;
      }

      let { message, time, seen, id: msgID } = user?.lastMessage;
      let { photoURL, name, id } = user?.userInfo;
      let { online } = usersStatusList.find((el) => el.id == id) || false;

      let options = { day: "2-digit", month: "2-digit", year: "numeric" };
      let msgDate = new Date(msgID).toLocaleDateString(["en-GB"], options);
      let today = new Date();
      let yesterday = new Date(new Date().setDate(today.getDate() - 1));

      if (today.toLocaleDateString(["en-GB"], options) == msgDate) {
        time = time;
      } else if (yesterday.toLocaleDateString(["en-GB"], options) == msgDate) {
        time = "Yesterday";
      } else {
        time = msgDate;
      }

      usersContainer.innerHTML += `
            <div class="user  ${
              !seen ? "not-seen" : ""
            } d-flex align-items-center gap-2 border-bottom" data-id="${id}" online="${online}">
              <div class="image">
                <img src="${photoURL}" alt="avatar" >
              </div>
              <div class="info flex-grow-1">
                <div class="top w-100 d-flex gap-2 justify-content-between">
                  <h6 class="name m-0 text-capitalize fw-bold">${name}</h6>
                  <span class="time text-muted">${time}</span>
                </div>
                <p class="message m-0 ${!seen ? "text-primary" : "text-muted"}">
                  <bdi>${
                    message.length > 40 ? message.slice(0, 40) + "..." : message
                  }</bdi>
                </p>
              </div>
            </div>
          `;
    }
  } catch (error) {
    console.log(error);
  }
}

let count = 0;
async function renderUserChats() {
  let usersContainer = document.querySelector(".chats .users");
  let user = JSON.parse(localStorage.getItem("currentUser"));
  document.querySelector(".chats .head img").src = user.photoURL;
  document.querySelector(".chats .head .username").textContent = user.name;
  try {
    unsnapUserChats = onSnapshot(doc(db, "userChats", `${user.id}`), (doc) => {
      if (!doc.exists()) {
        return;
      }

      if (!chatsPage.classList.contains("hide") && ++count > 1) {
        var promise = document.querySelector("#notification").play();

        if (promise !== undefined) {
          promise
            .then(() => {
              console.log("Played");
            })
            .catch((error) => {
              console.log("Audio failed to play");
            });
        }
      }

      let usersDoc = doc.data();
      let users = Object.values(usersDoc);

      let chatUsers = JSON.parse(sessionStorage.getItem("chatUsers"));
      const otherUserId = sessionStorage.getItem("otherUserId");

      if (chatUsers && otherUserId) {
        let user = users.find((user) => user.userInfo.id == otherUserId);
        let u = chatUsers.find((user) => user.userInfo.id == otherUserId);

        if (user.lastMessage.message == u.lastMessage.message && ++count > 1) {
          document.querySelector("#notification").play();
        } else {
        }
      }

      users.sort((a, b) => b.lastMessage.id - a.lastMessage.id);
      sessionStorage.setItem("chatUsers", JSON.stringify(users));

      unsnapUserStatus ? unsnapUserStatus() : null;
      detectUserStatus(users);
    });
  } catch (error) {
    new swal(error.message, "", "error");
    console.log(error);
  }
}
async function detectUserStatus(users) {
  try {
    let chatUsers = JSON.parse(sessionStorage.getItem("chatUsers"));
    if (!chatUsers) {
      return;
    }

    let chatUsersId = chatUsers
      .map((el) => el?.userInfo?.id)
      .filter((el) => el != undefined);

    const q = query(collection(db, "users"), where("id", "in", chatUsersId));
    unsnapUserStatus = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          if (usersStatusList.every((el) => el.id !== change.doc.data().id)) {
            usersStatusList.push(change.doc.data());
          }
        }
        if (change.type === "modified") {
          usersStatusList = usersStatusList.map((el) => {
            if (el.id == change.doc.data().id) return change.doc.data();
            else return el;
          });
        }
        if (change.type === "removed") {
          console.log("Removed city: ", change.doc.data());
        }

        addUserChatsToPage(users);
      });
    });
  } catch (error) {
    new swal(error.message, "", "error");
    console.log(error);
  }
}

async function register(e) {
  e.preventDefault();
  loader.classList.remove("hide");

  const firstName = document
    .getElementById("firstName")
    .value.trim()
    .toLowerCase();
  const lastName = document
    .getElementById("lastName")
    .value.trim()
    .toLowerCase();
  const email = document
    .getElementById("email-register")
    .value.trim()
    .toLowerCase();
  const password = document.getElementById("password-register").value.trim();
  const image = document.getElementById("image").files[0];

  let fullName = `${firstName} ${lastName}`;

  if (
    firstName == "" ||
    lastName == "" ||
    email == "" ||
    password == "" ||
    !image
  ) {
    loader.classList.add("hide");
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
      e.target.classList.remove("disabled");
      loader.classList.add("hide");
      new swal("Email already exists!", "", "warning");
      return;
    }

    // User not found so create a new one

    await uploadData(fullName, email, password);
  } catch (error) {
    console.log("Error creating user: ", error.message);
    new swal("Server Error", "", "error");
  }
  loader.classList.add("hide");
  e.target.classList.remove("disabled");
}

async function uploadData(fullName, email, password) {
  try {
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
            online: false,
          };

          setDoc(doc(db, "users", `${userID}`), currentUser);
          loader.classList.add("hide");
          new swal("Account Created Successfully!", "", "success");
          document.querySelector(".register").classList.remove("disabled");
          activeScreen(loginPage);

          return downloadURL;
        });
      }
    );
  } catch (error) {
    new swal(error.message, "", "error");
    console.log(error);
  }
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
