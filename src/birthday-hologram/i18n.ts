import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const en = {
    edition: 'A BIRTHDAY INVITATION',
    settings: 'Make yourself comfortable',
    language: 'Language',
    enableMotion: 'Enable phone motion',
    disableMotion: 'Disable phone motion',
    motionOff: 'Phone motion is optional.',
    motionRequesting: 'Waiting for permission…',
    motionOn: 'Tilt gently. Faster movement disturbs the signal.',
    motionDenied: 'Permission declined. You can still use the invitation.',
    motionUnavailable: 'Phone motion is unavailable in this browser.',
    motionPaused: 'Motion effects are paused.',
    reduceMotion: 'Reduce motion',
    systemMotion: 'Your device requests reduced motion.',
    highContrast: 'High contrast',
    color: 'Make it your color',
    colorHint: 'Your color carries into the invitation.',
    eyebrow: 'SOMETHING TO LOOK FORWARD TO',
    youre: 'YOU’RE',
    invited: 'INVITED',
    ready: 'READY TO OPEN',
    decrypting: 'DECRYPTING',
    opening: 'Opening invitation…',
    open: 'Open invitation',
    share: 'Share invitation',
    tagline: 'A birthday. An arcade bar. Good company.',
    passAlong: 'Come hang out. Pass it along.',
    back: 'Back to cover',
    birthday: 'BIRTHDAY NIGHT',
    subtitle: 'Come hang out at an arcade bar.',
    level: 'LEVEL',
    health: 'HEALTH',
    fine: 'Doing fine',
    survived: 'DAYS SURVIVED',
    when: 'WHEN',
    where: 'WHERE',
    datePending: 'Date coming soon',
    venuePending: 'Arcade bar coming soon',
    addressPending: 'Address coming soon',
    addCalendar: 'Add to calendar',
    calendarHint: 'Opens Google Calendar with the details filled in.',
    detailsPending: 'Date, time and location coming soon.',
    notWorking: 'Not working?',
    calendarBackup: 'Calendar backup',
    openCalendar: 'Open calendar link',
    openLink: 'Open invitation link',
    linkPending: 'The link is coming soon.',
    qrPending: 'The QR code isn’t ready yet. You can use the link below.',
    qrLoading: 'Preparing QR code…',
    know: 'Things to know',
    record: 'For the record',
    briefing:
        'Bring ID. No gifts. My real birthday was September 10th, so you can stop asking.',
    drinks:
        'I’ll have a couple drinks, if at all. When I do, my stomach writes to its congressmen. Weed is my chosen crutch.',
}

const es: Record<keyof typeof en, string> = {
    edition: 'UNA INVITACIÓN DE CUMPLEAÑOS',
    settings: 'Ponte a gusto',
    language: 'Idioma',
    enableMotion: 'Activar movimiento del teléfono',
    disableMotion: 'Desactivar movimiento',
    motionOff: 'El movimiento del teléfono es opcional.',
    motionRequesting: 'Esperando permiso…',
    motionOn: 'Inclina suavemente. El movimiento rápido altera la señal.',
    motionDenied: 'Permiso rechazado. Puedes seguir usando la invitación.',
    motionUnavailable: 'El movimiento no está disponible en este navegador.',
    motionPaused: 'Los efectos de movimiento están pausados.',
    reduceMotion: 'Reducir movimiento',
    systemMotion: 'Tu dispositivo solicita movimiento reducido.',
    highContrast: 'Alto contraste',
    color: 'Elige tu color',
    colorHint: 'Tu color se mantiene en la invitación.',
    eyebrow: 'ALGO QUE ESPERAR CON GANAS',
    youre: 'ESTÁS',
    invited: 'INVITADO',
    ready: 'LISTO PARA ABRIR',
    decrypting: 'DESCIFRANDO',
    opening: 'Abriendo invitación…',
    open: 'Abrir invitación',
    share: 'Compartir invitación',
    tagline: 'Un cumpleaños. Un bar arcade. Buena compañía.',
    passAlong: 'Ven a pasar el rato. Comparte la invitación.',
    back: 'Volver a la portada',
    birthday: 'NOCHE DE CUMPLEAÑOS',
    subtitle: 'Ven a pasar el rato en un bar arcade.',
    level: 'NIVEL',
    health: 'SALUD',
    fine: 'Todo bien',
    survived: 'DÍAS SOBREVIVIDOS',
    when: 'CUÁNDO',
    where: 'DÓNDE',
    datePending: 'Fecha por confirmar',
    venuePending: 'Bar arcade por confirmar',
    addressPending: 'Dirección por confirmar',
    addCalendar: 'Añadir al calendario',
    calendarHint: 'Abre Google Calendar con los datos completos.',
    detailsPending: 'Fecha, hora y lugar por confirmar.',
    notWorking: '¿No funciona?',
    calendarBackup: 'Enlace alternativo del calendario',
    openCalendar: 'Abrir enlace del calendario',
    openLink: 'Abrir enlace de la invitación',
    linkPending: 'El enlace estará disponible pronto.',
    qrPending: 'El código QR aún no está listo. Puedes usar el enlace de abajo.',
    qrLoading: 'Preparando código QR…',
    know: 'Lo que debes saber',
    record: 'Que conste',
    briefing:
        'Trae identificación. Nada de regalos. Mi cumpleaños fue el 10 de septiembre, así que ya puedes dejar de preguntar.',
    drinks:
        'Tomaré un par de copas, si acaso. Cuando lo hago, mi estómago escribe a sus congresistas. La marihuana es mi muleta preferida.',
}

let language = 'en'

try {
    const saved = localStorage.getItem('invite-language')
    if (saved === 'en' || saved === 'es') language = saved
} catch {
    language = 'en'
}

void i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        es: { translation: es },
    },
    lng: language,
    fallbackLng: 'en',
    supportedLngs: ['en', 'es'],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
})

export default i18n