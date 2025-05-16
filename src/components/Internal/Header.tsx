"use client";
import { useTranslation } from "react-i18next";
import { Settings, Github, History, BookText, Sparkles } from "lucide-react";
import { Button } from "@/components/Internal/Button";
import { useGlobalStore } from "@/store/global";

const VERSION = process.env.NEXT_PUBLIC_VERSION;

function Header() {
  const { t } = useTranslation();
  const { setOpenSetting, setOpenHistory, setOpenKnowledge } = useGlobalStore();

  return (
    <>
      <header className="flex justify-between items-center my-8 max-sm:my-6 print:hidden">
        <a 
          href="https://ritsl.com" 
          target="_blank" 
          className="flex items-center group transition-all"
        >
          <div className="bg-primary/10 p-2 rounded-full mr-3 group-hover:bg-primary/20 transition-colors">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-left text-2xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              {t("title")}
            </h1>
            <small className="font-medium text-sm text-muted-foreground">v{VERSION}</small>
          </div>
        </a>
        <div className="flex gap-1 bg-background/80 backdrop-blur-sm p-1 rounded-full shadow-sm border">
          <a href="https://ritsl.com" target="_blank">
            <Button
              className="h-9 w-9 rounded-full text-primary hover:text-primary hover:bg-primary/10"
              title={t("openSource")}
              variant="ghost"
              size="icon"
            >
              <Github className="h-5 w-5" />
            </Button>
          </a>
          <Button
            className="h-9 w-9 rounded-full text-secondary hover:text-secondary hover:bg-secondary/10"
            variant="ghost"
            size="icon"
            title={t("history.title")}
            onClick={() => setOpenHistory(true)}
          >
            <History className="h-5 w-5" />
          </Button>
          <Button
            className="h-9 w-9 rounded-full text-chart-4 hover:text-chart-4 hover:bg-chart-4/10"
            variant="ghost"
            size="icon"
            title={t("knowledge.title")}
            onClick={() => setOpenKnowledge(true)}
          >
            <BookText className="h-5 w-5" />
          </Button>
          <Button
            className="h-9 w-9 rounded-full text-accent hover:text-accent hover:bg-accent/10"
            title={t("setting.title")}
            variant="ghost"
            size="icon"
            onClick={() => setOpenSetting(true)}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>
    </>
  );
}

export default Header;
