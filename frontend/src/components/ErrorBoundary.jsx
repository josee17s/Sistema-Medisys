import { Component } from "react";
import { AlertTriangle } from "lucide-react";

// Componente encargado de capturar errores inesperados en la interfaz
export default class ErrorBoundary extends Component {
  // Inicializa el estado del componente
  constructor(props) {
    super(props);

    // Indica si se detecto un error en alguno de los componentes hijos
    this.state = { hasError: false };
  }

  // Actualiza el estado cuando un componente hijo genera un error
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // Captura el error y obtiene informacion adicional para registrarlo
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Error de interfaz capturado:", error, info);
  }

  // Restablece el estado del error y regresa a la pagina principal
  handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = "/";
  };

  // Renderiza la interfaz dependiendo de si ocurrio un error
  render() {
    // Muestra una pantalla de error cuando algun componente hijo falla
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-sm text-center">

            {/* Icono que representa una advertencia */}
            <AlertTriangle size={32} className="text-amber-500 mx-auto mb-3" />

            {/* Titulo mostrado al usuario */}
            <h1 className="font-display font-black text-lg text-ink mb-1">
              Ocurrió un problema
            </h1>

            {/* Mensaje que explica el problema al usuario */}
            <p className="text-sm text-ink/60 mb-4">
              Algo no cargó correctamente. Tu sesión sigue activa, solo necesitas
              volver a intentarlo.
            </p>

            {/* Boton para restablecer la interfaz */}
            <button className="btn-primary" onClick={this.handleReset}>
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }

    // Si no existe ningun error, muestra normalmente los componentes hijos
    return this.props.children;
  }
}