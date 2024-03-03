const {
	Client,
	LocalAuth
} = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const {
	enviarMensajeRecibido
} = require('../webhook')
const{enviarQr} = require('../../controller/envio_qr_controller')
const puppeteer = require('puppeteer');
let clienteWSP = null



const inicializarWSP = async (clientId,res,flag_api) => {  
  const browser = await puppeteer.launch({ headless: true,
    args: [
      '--no-sandbox',        
    ]
   });
  clienteWSP = new Client({
    authStrategy: new LocalAuth({
      clientId: clientId,
    }),    
    puppeteer: {
      browserWSEndpoint: await browser.wsEndpoint(),
      args: [
        '--no-sandbox',        
      ]      
    }
  })
      
  clienteWSP.on('qr', (qr) => {
    console.log(flag_api)
    if (flag_api){
      flag_api = false
      qrcode.generate(qr, { small: true });
      enviarQr(clientId,qr,res);
    }   
  })

  clienteWSP.on('authenticated', () => {  
      console.log('Autenticado!')
  })

  clienteWSP.on('auth_failure', (msg) => {
    console.error('Error de autenticación', msg)
  })

  clienteWSP.on('loading_screen', (porcentaje, mensaje) => {
    console.log(`Cargando: ${porcentaje} - ${mensaje}`)
  })

  clienteWSP.on('ready', () => {
    console.log('Client is ready!')
  })

  clienteWSP.on('message', message => {
    if (message.from!='status@broadcast'){
      console.log('Mensaje recibido', message.from, message.body)
      enviarMensajeRecibido(message.from, message.body)
    }    
  })
  await clienteWSP.initialize()
}

const enviarMensajeWSP = async (numero, mensaje) => {
	try {
		numero = numero + '@c.us'
    console.log(mensaje)
		const respuesta = await clienteWSP.sendMessage(numero, mensaje)
		return respuesta
	} catch (error) {
		const mensajeError = `Error al enviar mensaje a ${numero}`
		console.error(mensajeError, error)
		throw new Error(mensajeError)
	}
}

const statusCheck = async () => {
  try {
    const estado = await clienteWSP.getState()
    let response;
    if (estado === 'CONNECTED') {
      response = {
        status: 'connected'
      }
      return response
    }else{
      response = {
        status: 'disconnected'
      }
      return response
    }
  } catch (error) {
    const mensajeError = `Error al obtener el estado del cliente`
    console.error(mensajeError, error)
    throw new Error(mensajeError)
  }
}

module.exports = {
	inicializarWSP,
	enviarMensajeWSP,
  statusCheck
}