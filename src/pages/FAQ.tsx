import PageLayout from '@/components/shared/PageLayout';
import PageBreadcrumbs from '@/components/shared/PageBreadcrumbs';

const FAQ = () => (
  <PageLayout>
    <PageBreadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Preguntas frecuentes' }]} />
    <h1 className="font-display text-4xl md:text-5xl text-foreground mb-8">Preguntas frecuentes</h1>
    <p className="font-body text-muted-foreground">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
    </p>
  </PageLayout>
);

export default FAQ;
