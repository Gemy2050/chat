import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js';
import { getFirestore, collection, query, where, getDocs,getDoc, setDoc, addDoc, doc,deleteDoc,onSnapshot,orderBy, limit,startAt,endAt } from 'https://www.gstatic.com/firebasejs/9.8.2/firebase-firestore.js';


const firebaseConfig = {
  apiKey: "AIzaSyBp8VDM0i3MRj3ubLXGtFEh_OfMdt4b1_Y",
  authDomain: "firstproject-ee3fe.firebaseapp.com",
  projectId: "firstproject-ee3fe",
  storageBucket: "firstproject-ee3fe.appspot.com",
  messagingSenderId: "427355085094",
  appId: "1:427355085094:web:82916109a1ae5f5518c9e7"
};


firebase.initializeApp(firebaseConfig);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);



// Variables
let addButton = document.querySelector(".add-user");
let popup = document.querySelector(".popup");
let form = document.querySelector("form");
let tableBody = document.querySelector("table tbody");

let id, username;


form.onsubmit = (e) => {
  e.preventDefault();

  if(form.querySelector(".submit").value == 'edit') {

    setDoc(doc(db, "collection 1", `${id}`) , {
      id: id,
      name: form.name.value,
      phone: form.phone.value,
      email: form.email.value
    });


    getResponse();

    popup.classList.remove("active");
    form.querySelector(".submit").value = 'submit'
    swal.fire(`Updated`,`${username} updated successfully`,"success");

    form.reset();

  } else {


    setDoc(doc(db, "collection 1", `${Date.now()}`) , {
      id: Date.now(),
      name: form.name.value,
      phone: form.phone.value,
      email: form.email.value
    });
  
    getResponse();
  
    swal.fire(`Completed`,`${form.name.value} added successfully`,"success");
    
    form.reset();


  }

  
}

addButton.onclick = () => {
  popup.classList.add("active")
}

document.querySelector(".popup .close").onclick = function() {
  this.parentElement.parentElement.classList.remove("active");
}


document.addEventListener("click", (e) => {
  if(e.target.className == 'delete') {
    let docObj = doc(db, "collection 1", `${e.target.parentElement.dataset.id}`);
    deleteDoc(docObj);
    getResponse();
  } else if(e.target.className == 'edit') {
    getDoc(doc(db, "collection 1", `${e.target.parentElement.dataset.id}`)).then((e)=>{
      console.log(e.data());
      form.name.value = e.data().name;
      form.phone.value = e.data().phone;
      form.email.value = e.data().email;

      id = e.data().id;
      username = e.data().name;

      form.querySelector(".submit").value = 'edit';
    });
    popup.classList.add("active")
  }
})






/* start 002 getDoc */
// getDoc(doc(db, "collection 1", `13`)).then( e =>{
  // document.querySelector("h1").innerHTML = e.data().name;
    // console.log(e.data());
    // swal.fire(`${e.data().name}`,e.data().text,"success");
// });
/* end 002 getDoc */








/* start 003 deleteDoc */
// document.querySelector(".btnForDeleteDoc").addEventListener("click",(e)=>{
//     let orderDoc = doc(db, "collection 1", `34`);
//     deleteDoc(orderDoc);
// })
/* end 003 deleteDoc */





/* start 004 get all Docs */

async function getAllDocs(collectionName){
  
  let q = query(collection(db, `${collectionName}`));

  let querySnapshot = await getDocs(q);
  let list = querySnapshot.docs.map(doc => doc.data());

  return list;
};

getResponse();

function getResponse() {

  getAllDocs("collection 1").then((arr) => {
    
    tableBody.innerHTML = '';

    arr.forEach((el) => {
        tableBody.innerHTML += `
        <tr>
          <td>${el.name}</td>
          <td>${el.phone}</td>
          <td>${el.email}</td>
          <td data-id=${el.id}>
            <button class="edit">Edit</button>
            <button class="delete">Delete</button>
          </td>
        </tr> 
      ` 
    })

})
}

/* end 004 get all Docs */



