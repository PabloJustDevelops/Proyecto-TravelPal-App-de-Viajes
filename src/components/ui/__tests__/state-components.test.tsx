import { render, screen, fireEvent } from '@testing-library/react'
import PageTitle from '@/components/ui/PageTitle'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import Button from '@/components/ui/Button'

describe('PageTitle', () => {
  it('renderiza el titulo como encabezado de nivel 1', () => {
    render(<PageTitle title="Mis Viajes" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Mis Viajes')
  })

  it('muestra el subtitulo y la accion cuando se pasan', () => {
    render(
      <PageTitle
        title="Mis Viajes"
        subtitle="Organiza tus destinos"
        action={<Button>Nuevo</Button>}
      />,
    )

    expect(screen.getByText('Organiza tus destinos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nuevo' })).toBeInTheDocument()
  })

  it('omite el subtitulo si no se pasa', () => {
    const { container } = render(<PageTitle title="Mis Viajes" />)
    expect(container.querySelectorAll('p')).toHaveLength(0)
  })
})

describe('EmptyState', () => {
  it('explica el estado vacio y ofrece la accion', () => {
    render(
      <EmptyState
        title="No tienes notas registradas"
        description="Comienza creando tu primera nota"
        action={<Button>Crear Primera Nota</Button>}
      />,
    )

    expect(screen.getByText('No tienes notas registradas')).toBeInTheDocument()
    expect(screen.getByText('Comienza creando tu primera nota')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Crear Primera Nota' }),
    ).toBeInTheDocument()
  })

  it('funciona sin descripcion ni accion', () => {
    render(<EmptyState title="No hay nada" />)
    expect(screen.getByText('No hay nada')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('ErrorState', () => {
  it('muestra el mensaje real del error, no un estado vacio', () => {
    render(<ErrorState message="Se perdio la conexion con el servidor" />)

    expect(screen.getByText('Se perdio la conexion con el servidor')).toBeInTheDocument()
    expect(screen.getByText('Error al cargar los datos')).toBeInTheDocument()
  })

  it('ofrece reintentar cuando se pasa un manejador', () => {
    const onRetry = jest.fn()
    render(<ErrorState message="Fallo la red" onRetry={onRetry} />)

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('no ofrece reintentar si no hay manejador', () => {
    render(<ErrorState message="Fallo la red" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('permite personalizar el titulo y la etiqueta del boton', () => {
    render(
      <ErrorState
        title="No se pudo cargar el viaje"
        message="Detalle"
        onRetry={() => {}}
        retryLabel="Volver a intentar"
      />,
    )

    expect(screen.getByText('No se pudo cargar el viaje')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Volver a intentar' }),
    ).toBeInTheDocument()
  })
})
