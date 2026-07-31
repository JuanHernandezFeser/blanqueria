import PageLayout from '@/components/shared/PageLayout';
import PageBreadcrumbs from '@/components/shared/PageBreadcrumbs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Mail, MessageCircle } from 'lucide-react';

const FAQ_SECTIONS = [
  {
    title: '🛒 Compras y pedidos',
    items: [
      {
        q: '¿Puedo comprar sin registrarme?',
        a: 'Sí. Podés comprar como invitado y vas a recibir la confirmación de tu pedido por email. Si creás una cuenta, además podés ver tus pedidos y seguir su estado desde "Mi cuenta".',
      },
      {
        q: '¿Cómo veo el estado de mi pedido?',
        a: 'Con tu cuenta, entrando a "Mi cuenta". Los estados son: Pendiente → En preparación → Enviado → Entregado. Te enviamos un email cada vez que el estado de tu pedido cambia.',
      },
      {
        q: '¿Qué pasa si pagué por transferencia?',
        a: 'El pedido queda en "Pendiente" hasta que se acredite el pago. Una vez acreditado, lo ponemos en preparación y te avisamos por email.',
      },
      {
        q: '¿Cómo hago un cambio o devolución?',
        a: 'Escribinos y lo resolvemos. Podés contactarnos por email a compras@aikenblanco.com.ar o por WhatsApp y coordinamos el cambio o devolución.',
      },
    ],
  },
  {
    title: '🚚 Envíos',
    items: [
      {
        q: '¿Hacen envíos a todo el país?',
        a: 'Sí, hacemos envíos a toda Argentina a través de Correo Argentino.',
      },
      {
        q: '¿Cuánto tarda y cuánto cuesta el envío?',
        a: 'Depende de tu código postal. Ingresalo en el carrito o en el checkout y el costo se calcula en el momento con la tarifa de Correo Argentino. Los plazos aproximados son de 3 a 5 días hábiles según el destino.',
      },
      {
        q: '¿Puedo retirar mi pedido?',
        a: 'Sí, ofrecemos retiro en persona en Bahía Blanca. Coordinamos la entrega por WhatsApp o email.',
      },
    ],
  },
  {
    title: '💳 Pagos',
    items: [
      {
        q: '¿Qué medios de pago aceptan?',
        a: 'Aceptamos Mercado Pago (débito, crédito, transferencia y efectivo) y transferencia bancaria directa.',
      },
      {
        q: '¿Hay descuento pagando por transferencia?',
        a: 'Sí, tenés un 8% de descuento abonando por transferencia bancaria. Los datos (Banco Provincia, CBU y alias AIKEN.BLANCO) se muestran al confirmar el pedido.',
      },
      {
        q: '¿Se puede pagar en cuotas?',
        a: 'Las cuotas dependen de la tarjeta al pagar con Mercado Pago. Al elegir ese medio vas a ver las opciones disponibles.',
      },
    ],
  },
  {
    title: '🧺 Productos y cuenta',
    items: [
      {
        q: '¿Por qué me piden completar mis datos al registrarme?',
        a: 'Necesitamos tu dirección y teléfono para armar el envío de tus pedidos. Podés completarlos al registrarte o después desde tu cuenta.',
      },
      {
        q: '¿Cómo verifico mi email?',
        a: 'Al crear la cuenta te llega un mail con un botón de verificación. Si no lo recibís, podés reenviarlo desde el ingreso.',
      },
      {
        q: '¿Qué talles y colores tienen?',
        a: 'Cada producto indica sus variantes (talle y color) con el stock disponible en tiempo real.',
      },
    ],
  },
];

const FAQ = () => (
  <PageLayout>
    <PageBreadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Preguntas frecuentes' }]} />
    <h1 className="font-display text-4xl md:text-5xl text-foreground mb-2">Preguntas frecuentes</h1>
    <p className="font-body text-sm text-muted-foreground mb-10">
      Encontrá las respuestas a las dudas más comunes sobre compras, envíos y pagos.
    </p>

    <div className="space-y-10">
      {FAQ_SECTIONS.map((section) => (
        <section key={section.title}>
          <h2 className="font-display text-2xl text-foreground mb-2">{section.title}</h2>
          <Accordion type="single" collapsible>
            {section.items.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="font-body text-sm text-foreground text-left">{item.q}</AccordionTrigger>
                <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ))}
    </div>

    <div className="mt-12 rounded-lg bg-secondary/50 p-8 flex flex-col items-center text-center gap-4">
      <p className="font-display text-2xl text-foreground">¿Tenés otra duda?</p>
      <p className="font-body text-sm text-muted-foreground">Escribinos y te respondemos a la brevedad.</p>
      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        <a
          href="https://wa.me/542914316639"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-md bg-[#25D366] px-6 py-3 text-xs font-medium uppercase tracking-wider text-white font-body hover:opacity-90 transition-opacity"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
        <a
          href="mailto:compras@aikenblanco.com.ar"
          className="flex items-center justify-center gap-2 rounded-md bg-foreground px-6 py-3 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity"
        >
          <Mail className="h-4 w-4" /> compras@aikenblanco.com.ar
        </a>
      </div>
    </div>
  </PageLayout>
);

export default FAQ;
