// Root page delegates to the marketing/landing page component.
import Index from './pages/index';

export default function HomePage() {
  return (
    <>
      <main>
        <Index/>
      </main>
    </>
  );
}