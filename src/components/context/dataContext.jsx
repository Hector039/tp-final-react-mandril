import { createContext } from "react";
import { useState, useEffect } from "react";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { DataBase } from "../../Firebase/config";

import { auth, googleProvider } from "../../Firebase/config";
import { createUserWithEmailAndPassword, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

export const DataContext = createContext([]);
const carritoEnLs = JSON.parse(localStorage.getItem("carrito")) || [];

export const DataProvider = ({children}) => {

    const MySwal = withReactContent(Swal);

    const [carrito, setCarrito] = useState(carritoEnLs);
    
    const [productos, setProductos] = useState([]);

    const carritoNumero = () => {
        return carrito.reduce((acumulador, item) => acumulador + item.cantidad, 0);
    }

    const [proxItems, setProxItems] = useState(3);

    useEffect(()=>{
        localStorage.setItem("carrito", JSON.stringify(carrito));
    }, [carrito])

    function handleAgregar(producto, cantidad) {
        const productoSel = {...producto, cantidad};
        const carritoCopia = [...carrito];
        const prodEncontradoCarrito = carritoCopia.find((item) => item.id === productoSel.id);
        
        if (prodEncontradoCarrito){
            prodEncontradoCarrito.cantidad += cantidad;
        } else {
            carritoCopia.push(productoSel)
        }
        setCarrito(carritoCopia);
    }

    const handleVaciar = () => {
        setCarrito([]);
    }

    function eliminarItem(id) {
        const itemId = carrito.find((item) => item.id === id);
        const carritoNuevo = carrito.filter((item) => item.id !== itemId.id);
        setCarrito(carritoNuevo);
    }

    const [filtroCategoria, setFiltroCategoria] = useState([]);
    const [targetIn, setTargetIn] = useState("todos");
    const [eventIn, setEventIn] = useState();

    function filtrarPorCategoria(e) {
        setTargetIn(e.target.value);
    }

    function filtrarPrecio(e) {
        setEventIn(e.target.value);
    }

    useEffect(() => {
        const q = targetIn === "todos" ? query(collection(DataBase, "productos"), limit(proxItems)) : 
        query(collection(DataBase, "productos"), where("categoria", "==", targetIn), limit(proxItems));

        getDocs(q)
            .then((resp) => {
                setProductos(

                    resp.docs.map((obj) => {
                        return {...obj.data(), id: obj.id}
                    })
            )
        })

    },[ targetIn, proxItems ])

    useEffect(() => {
        
        const productosOrdenados = productos.sort(function (a, b) {
            if (eventIn === "menor") {
                return (a.precio - b.precio);
            } else if (eventIn === "mayor") {
                return (b.precio - a.precio);
            } else if (eventIn === "todos") {
                return productos;
            }else{
                return productos;
            }
        });
        setFiltroCategoria(productosOrdenados);
}, [eventIn, productos]);

    console.log(productos);

    /* seccion usuarios */

    const [ userState, setUserState ] = useState(null);

    const login = async (e) => {
        await signInWithEmailAndPassword(auth, e.ecorreo, e.pass);
        MySwal.fire({
            icon: "success",
            title: "Usuario Existente",
            text: "Se inició sesión correctamente"
        })
        setUserState(auth.currentUser);
    }

    const accederConGoogle = async() =>{
        await signInWithPopup(auth, googleProvider);
        setUserState(auth.currentUser);
    }

    const newRegister = async (e) => {
        await createUserWithEmailAndPassword(auth, e.email, e.password);
        MySwal.fire({
            icon: "success",
            title: "Usuario Nuevo",
            text: "Se registró el usuario correctamente"
        })
        setUserState(auth.currentUser);
    }

    console.log(userState);



    return (
        <DataContext.Provider value={{ productos, carrito, setCarrito, 
        carritoNumero, handleAgregar, 
        handleVaciar, eliminarItem, filtroCategoria,
        filtrarPorCategoria, filtrarPrecio, proxItems, setProxItems,
        login, accederConGoogle, newRegister, userState, setUserState}}>
            {children}
        </DataContext.Provider>
    )
}
