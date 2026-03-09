import { useConfig } from '@/providers/ConfigProvider';

export function SiteFooter() {
  const config = useConfig();

  return (
    <footer className="border-t py-4 px-4">
      <div className="container flex items-center justify-between">
        <div className="text-sm text-muted-foreground">MeshtasticBot UI {config.version}</div>
        <div className="text-sm text-muted-foreground">© {new Date().getFullYear()} MeshtasticBot</div>
      </div>
    </footer>
  );
}
