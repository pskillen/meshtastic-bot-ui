import { useConfig } from '@/providers/ConfigProvider';

export function SiteFooter() {
  const config = useConfig();

  return (
    <footer className="border-t-2 border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-900">
      <div className="flex w-full flex-col gap-3 px-4 py-4 sm:flex-row sm:items-end sm:justify-between lg:px-6">
        <div className="flex flex-col gap-0.5">
          <span className="font-header text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
            MeshFlow
          </span>
          <span className="font-mono text-sm font-medium text-slate-600 dark:text-slate-400">
            MeshtasticBot UI {config.version}
          </span>
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          © {new Date().getFullYear()} MeshtasticBot
        </p>
      </div>
    </footer>
  );
}
