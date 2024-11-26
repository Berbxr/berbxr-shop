// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBOWVuEmRJGCNLRj9WHNrb4w8NrG4NA5wQ",
    authDomain: "berbxr-tienda.firebaseapp.com",
    projectId: "berbxr-tienda",
    storageBucket: "berbxr-tienda.appspot.com",
    messagingSenderId: "501799385398",
    appId: "1:501799385398:web:ae9fd84053617f799ddb97"
};

// Inicializar Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(app);
const auth = firebase.auth(app);


// Cargar la vista de juegos al iniciar
document.addEventListener("DOMContentLoaded", () => {
    cargarVista("catalogo");
});


// Manejo de sesión al iniciar la aplicación
auth.onAuthStateChanged((user) => {
    if (user) {
        // Usuario autenticado, obtener datos adicionales
        db.collection("usuarios").doc(user.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    currentUser = doc.data();
                    actualizarNavbarAutenticado(currentUser);
                    console.log("Usuario autenticado:", currentUser);
                } else {
                    console.error("No se encontraron datos del usuario.");
                }
            })
            .catch((error) => {
                console.error("Error al obtener los datos del usuario:", error);
            });
    } else {
        // Usuario no autenticado
        currentUser = null;
        actualizarNavbarInvitado();
        console.log("Usuario no autenticado.");
    }
});

// Actualizar Navbar para usuario autenticado
function actualizarNavbarAutenticado(userData) {
    const navAuth = document.getElementById("nav-auth");
    navAuth.innerHTML = `
        <li class="nav-item">
          <a class="nav-link" href="#">${userData.name} ${userData.surname}</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" onclick="mostrarComprasRealizadas()">Compras Realizadas</a>
        </li>
        <li class="nav-item">
        <a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#modalCarrito">
          <i class="bi bi-cart-fill"></i> <span id="contador-carrito"></span>
         </a>
        </li>
        <li class="nav-item">
        <a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#modalConfigurarPerfil">Configurar Perfil</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" onclick="cerrarSesion()">Cerrar Sesión</a>
        </li>
    `;
}

// Actualizar Navbar para invitado
function actualizarNavbarInvitado() {
    const navAuth = document.getElementById("nav-auth");
    navAuth.innerHTML = `
        <li class="nav-item">
          <a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#modalLogin">Iniciar Sesión</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#modalRegister">Crear Cuenta</a>
        </li>
    `;
}

// Manejo del formulario de inicio de sesión
document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            mostrarAlerta("Inicio de sesión exitoso", "success");
            const modalLogin = bootstrap.Modal.getInstance(document.getElementById("modalLogin"));
            modalLogin.hide();
        })
        .catch((error) => {
            console.error("Error al iniciar sesión:", error);
            mostrarAlerta("Error al iniciar sesión. Verifica tus credenciales.", "danger");
        });
});

// Manejo del formulario de registro
document.getElementById("registerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("registerName").value;
    const surname = document.getElementById("registerSurname").value;
    const nationality = document.getElementById("registerNationality").value;
    const age = document.getElementById("registerAge").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            return db.collection("usuarios").doc(user.uid).set({
                name,
                surname,
                nationality,
                age,
                email
            });
        })
        .then(() => {
            mostrarAlerta("Registro exitoso", "success");
            const modalRegister = bootstrap.Modal.getInstance(document.getElementById("modalRegister"));
            modalRegister.hide();
        })
        .catch((error) => {
            console.error("Error al registrar usuario:", error);
            mostrarAlerta("Error al crear cuenta. Intenta nuevamente.", "danger");
        });
});

// Función para mostrar alertas dinámicas
function mostrarAlerta(mensaje, tipo = "success") {
    const alertas = document.getElementById("alertas") || document.createElement("div");
    alertas.id = "alertas";
    alertas.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    document.body.prepend(alertas);
}

// Cerrar sesión
function cerrarSesion() {
    auth.signOut()
        .then(() => {
            mostrarAlerta("Sesión cerrada con éxito", "success");
        })
        .catch((error) => {
            console.error("Error al cerrar sesión:", error);
            mostrarAlerta("Ocurrió un error al cerrar sesión.", "danger");
        });
}


// Mostrar Compras Realizadas
function mostrarComprasRealizadas() {
    const contenedorCompras = document.getElementById("contenedor-compras");
    const contenedorJuegos = document.getElementById("contenedor-juegos");

    contenedorJuegos.classList.add("d-none");
    contenedorCompras.classList.remove("d-none");
    contenedorCompras.innerHTML = `<h3 class="mb-4">Compras Realizadas</h3>`;

    db.collection("compras").where("userId", "==", auth.currentUser.uid).get()
        .then((snapshot) => {
            if (snapshot.empty) {
                contenedorCompras.innerHTML += `<p>No hay compras registradas.</p>`;
            } else {
                snapshot.forEach((doc) => {
                    const compra = doc.data();
                    const compraId = doc.id;

                    const card = document.createElement("div");
                    card.classList.add("card", "mb-3");
                    card.innerHTML = `
                        <div class="card-body">
                            <h5 class="card-title">Compra realizada el ${new Date(compra.fecha.seconds * 1000).toLocaleString()}</h5>
                            <p><strong>Total: </strong>$${compra.total.toFixed(2)}</p>
                            <ul class="list-group mb-3">
                                ${compra.juegos.map(juego => `<li class="list-group-item">${juego.nombre} - $${juego.precio}</li>`).join('')}
                            </ul>
                            <button class="btn btn-danger" onclick="reembolsarCompra('${compraId}')">Reembolsar</button>
                        </div>
                    `;
                    contenedorCompras.appendChild(card);
                });
            }
        })
        .catch((error) => {
            console.error("Error al obtener las compras:", error);
            mostrarAlerta("Ocurrió un error al obtener las compras. Intenta nuevamente.", "danger");
        });
}

// Reembolsar Compra
function reembolsarCompra(compraId) {
    db.collection("compras").doc(compraId).delete()
        .then(() => {
            mostrarAlerta("Compra reembolsada con éxito", "success");
            mostrarComprasRealizadas(); // Actualizar la vista
        })
        .catch((error) => {
            console.error("Error al reembolsar la compra:", error);
            mostrarAlerta("No se pudo reembolsar la compra. Intenta nuevamente.", "danger");
        });
}

// Función para cargar juegos por categoría
function cargarVista(nombreVista) {
    const contenedorCompras = document.getElementById("contenedor-compras");
    const contenedorJuegos = document.getElementById("contenedor-juegos");

    contenedorCompras.classList.add("d-none");
    contenedorJuegos.classList.remove("d-none");
    contenedorJuegos.innerHTML = "";

    let filtro = null;
    if (nombreVista === "promociones") filtro = "Descuento";
    else if (nombreVista === "nuevos") filtro = "Nuevo";
    else if (nombreVista === "mas-vendidos") filtro = "masVendido";

    const query = filtro ? db.collection("productos").where(filtro, "==", true) : db.collection("productos");

    query.get()
        .then((snapshot) => {
            if (snapshot.empty) {
                contenedorJuegos.innerHTML = "<p>No hay juegos disponibles en esta categoría.</p>";
            } else {
                snapshot.forEach((doc) => {
                    agregarJuegoACatalogo(doc.data(), doc.id, contenedorJuegos);
                });
            }
        })
        .catch((error) => {
            console.error("Error al cargar los juegos:", error);
            mostrarAlerta("Ocurrió un error al cargar los juegos.", "danger");
        });
}

// Mostrar juegos en el catálogo
function agregarJuegoACatalogo(producto, id, contenedor) {
    const card = document.createElement("div");
    card.classList.add("col-md-4", "mb-4");
    card.innerHTML = `
        <div class="card">
            <img src="${producto.imagen}" class="card-img-top" alt="${producto.Nombre}">
            <div class="card-body">
                <h5 class="card-title">${producto.Nombre}</h5>
                <p class="card-text">Precio: $${producto.Precio}</p>
                <button class="btn btn-primary" onclick="agregarAlCarrito('${id}', '${producto.Nombre}', ${producto.Precio})">Agregar al Carrito</button>
            </div>
        </div>
    `;
    contenedor.appendChild(card);
}

//CARRRITOOOOOOOO


let carrito = [];
let currentUser = null;

// Función para actualizar el ícono del carrito dinámicamente
function actualizarIconoCarrito() {
    const contadorCarrito = document.getElementById("contador-carrito");
    const cantidadTotal = carrito.reduce((total, item) => total + item.cantidad, 0);

    if (cantidadTotal > 0) {
        contadorCarrito.textContent = `(${cantidadTotal})`;
    } else {
        contadorCarrito.textContent = "";
    }
}

// Función para agregar un juego al carrito
function agregarAlCarrito(id, nombre, precio) {
    const itemExistente = carrito.find(item => item.id === id);
    if (itemExistente) {
        itemExistente.cantidad += 1;
        itemExistente.subtotal += precio;
    } else {
        carrito.push({ id, nombre, precio, cantidad: 1, subtotal: precio });
    }
    guardarCarritoEnFirebase();
    actualizarCarrito();
    actualizarIconoCarrito();
}

// Función para quitar un juego del carrito
function quitarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    guardarCarritoEnFirebase();
    actualizarCarrito();
    actualizarIconoCarrito();
}

// Función para vaciar el carrito
function vaciarCarrito() {
    carrito = [];
    guardarCarritoEnFirebase();
    actualizarCarrito();
    actualizarIconoCarrito();
}

// Función para actualizar el contenido del carrito
function actualizarCarrito() {
    const listaCarrito = document.getElementById("listaCarrito");
    const totalPagarElement = document.getElementById("totalPagar");

    listaCarrito.innerHTML = "";
    let total = 0;

    carrito.forEach((item) => {
        const listItem = document.createElement("li");
        listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

        listItem.innerHTML = `
            <div>
                ${item.nombre} - Cantidad: ${item.cantidad}
                <span class="badge bg-primary rounded-pill">$${item.subtotal.toFixed(2)}</span>
            </div>
            <button class="btn btn-sm btn-danger" onclick="quitarDelCarrito('${item.id}')">Quitar</button>
        `;
        total += item.subtotal;
        listaCarrito.appendChild(listItem);
    });

    totalPagarElement.textContent = `Total a pagar: $${total.toFixed(2)}`;
}

// Guardar el carrito en Firebase
function guardarCarritoEnFirebase() {
    if (auth.currentUser) {
        db.collection("usuarios").doc(auth.currentUser.uid).set({ carrito })
            .then(() => console.log("Carrito guardado en Firebase."))
            .catch((error) => console.error("Error al guardar el carrito:", error));
    }
}

// Cargar el carrito desde Firebase
function cargarCarritoDesdeFirebase() {
    if (auth.currentUser) {
        db.collection("usuarios").doc(auth.currentUser.uid).get()
            .then((doc) => {
                if (doc.exists && doc.data().carrito) {
                    carrito = doc.data().carrito;
                    actualizarCarrito();
                    actualizarIconoCarrito();
                }
            })
            .catch((error) => console.error("Error al cargar el carrito:", error));
    }
}

// Manejo de sesión al iniciar la aplicación
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        cargarCarritoDesdeFirebase();
        actualizarNavbarAutenticado(user);
    } else {
        currentUser = null;
        carrito = [];
        actualizarCarrito();
        actualizarIconoCarrito();
        actualizarNavbarInvitado();
    }
});

// Inicializar el ícono del carrito al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    actualizarIconoCarrito();
});


function comprar() {
    if (carrito.length === 0) {
        mostrarAlerta("El carrito está vacío", "warning");
        return;
    }

    const compra = {
        userId: auth.currentUser.uid,
        juegos: carrito.map(item => ({
            nombre: item.nombre,
            precio: item.subtotal,
            cantidad: item.cantidad
        })),
        total: carrito.reduce((total, item) => total + item.subtotal, 0),
        fecha: new Date()
    };

    db.collection("compras").add(compra)
        .then(() => {
            mostrarAlerta("Compra realizada con éxito", "success");
            carrito = [];
            actualizarCarrito();
        })
        .catch((error) => {
            console.error("Error al guardar la compra:", error);
            mostrarAlerta("Ocurrió un error al procesar la compra.", "danger");
        });
}

// Mostrar alertas
function mostrarAlerta(mensaje, tipo = "success") {
    const alertas = document.getElementById("alertas") || document.createElement("div");
    alertas.id = "alertas";
    alertas.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    document.body.prepend(alertas);
}

// Función para buscar un juego por nombre
function buscarJuego(event) {
    event.preventDefault();
    const searchInput = document.getElementById("searchInput").value.toLowerCase();

    // Si no hay texto ingresado, recargar el catálogo completo
    if (!searchInput.trim()) {
        cargarVista("catalogo");
        return;
    }

    const contenedorJuegos = document.getElementById("contenedor-juegos");
    contenedorJuegos.innerHTML = "<p>Buscando juegos...</p>";

    // Buscar en Firebase los juegos que coincidan
    db.collection("productos").get()
        .then((snapshot) => {
            const resultados = [];
            snapshot.forEach((doc) => {
                const producto = doc.data();
                if (producto.Nombre.toLowerCase().includes(searchInput)) {
                    resultados.push({ id: doc.id, ...producto });
                }
            });

            // Mostrar resultados
            if (resultados.length > 0) {
                contenedorJuegos.innerHTML = "";
                resultados.forEach((producto) => {
                    agregarJuegoACatalogo(producto, producto.id, contenedorJuegos);
                });
            } else {
                contenedorJuegos.innerHTML = "<p>No se encontraron juegos con ese nombre.</p>";
            }
        })
        .catch((error) => {
            console.error("Error al buscar juegos:", error);
            contenedorJuegos.innerHTML = "<p>Ocurrió un error al buscar juegos.</p>";
        });
}

// Función para agregar un juego al catálogo visualmente
function agregarJuegoACatalogo(producto, id, contenedor) {
    const card = document.createElement("div");
    card.classList.add("col-md-4", "mb-4");
    card.innerHTML = `
        <div class="card">
            <img src="${producto.imagen}" class="card-img-top" alt="${producto.Nombre}">
            <div class="card-body">
                <h5 class="card-title">${producto.Nombre}</h5>
                <p class="card-text">Precio: $${producto.Precio}</p>
                <button class="btn btn-primary" onclick="agregarAlCarrito('${id}', '${producto.Nombre}', ${producto.Precio})">Agregar al Carrito</button>
            </div>
        </div>
    `;
    contenedor.appendChild(card);
}

// Función para cargar datos actuales del perfil en el modal
function cargarDatosPerfil() {
    if (auth.currentUser) {
        db.collection("usuarios").doc(auth.currentUser.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    document.getElementById("configNombre").value = userData.name || "";
                    document.getElementById("configApellido").value = userData.surname || "";
                    document.getElementById("configEdad").value = userData.age || "";
                    document.getElementById("configNacionalidad").value = userData.nationality || "";
                }
            })
            .catch((error) => console.error("Error al cargar los datos del perfil:", error));
    }
}

// Función para guardar cambios en el perfil
document.getElementById("formConfigurarPerfil").addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = document.getElementById("configNombre").value.trim();
    const apellido = document.getElementById("configApellido").value.trim();
    const edad = document.getElementById("configEdad").value.trim();
    const nacionalidad = document.getElementById("configNacionalidad").value.trim();

    if (auth.currentUser) {
        db.collection("usuarios").doc(auth.currentUser.uid).update({
            name: nombre,
            surname: apellido,
            age: edad,
            nationality: nacionalidad
        })
        .then(() => {
            mostrarAlerta("Perfil actualizado con éxito", "success");
            const modal = bootstrap.Modal.getInstance(document.getElementById("modalConfigurarPerfil"));
            modal.hide();
        })
        .catch((error) => {
            console.error("Error al actualizar el perfil:", error);
            mostrarAlerta("Error al actualizar el perfil. Intenta nuevamente.", "danger");
        });
    }
});

// Actualizar la barra de navegación con opción de configuración
function actualizarNavbarAutenticado(userData) {
    const navAuth = document.getElementById("nav-auth");
    navAuth.innerHTML = `
        <li class="nav-item">
          <a class="nav-link" href="#">${userData.name} ${userData.surname}</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" onclick="mostrarComprasRealizadas()">Compras Realizadas</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#modalCarrito">
            <i class="bi bi-cart-fill"></i> <span id="contador-carrito"></span>
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#modalConfigurarPerfil" onclick="cargarDatosPerfil()">Configurar Perfil</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" onclick="cerrarSesion()">Cerrar Sesión</a>
        </li>
    `;
}

