"use client";
import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  LoaderCircle,
  CircleCheck,
  TextSearch,
  Download,
  Trash,
  RotateCcw,
  NotebookText,
} from "lucide-react";
import { Button } from "@/components/Internal/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import useAccurateTimer from "@/hooks/useAccurateTimer";
import useDeepResearch from "@/hooks/useDeepResearch";
import useKnowledge from "@/hooks/useKnowledge";
import { useTaskStore } from "@/store/task";
import { useKnowledgeStore } from "@/store/knowledge";
import { downloadFile } from "@/utils/file";

const MagicDown = dynamic(() => import("@/components/MagicDown"));
const MagicDownView = dynamic(() => import("@/components/MagicDown/View"));

const formSchema = z.object({
  suggestion: z.string().optional(),
});

function TaskState({ state }: { state: SearchTask["state"] }) {
  if (state === "completed") {
    return <CircleCheck className="h-5 w-5" />;
  } else if (state === "processing") {
    return <LoaderCircle className="animate-spin h-5 w-5" />;
  } else {
    return <TextSearch className="h-5 w-5" />;
  }
}

function SearchResult() {
  const { t } = useTranslation();
  const taskStore = useTaskStore();
  const { runSearchTask, reviewSearchResult } = useDeepResearch();
  const { generateId } = useKnowledge();
  const {
    formattedTime,
    start: accurateTimerStart,
    stop: accurateTimerStop,
  } = useAccurateTimer();
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const unfinishedTasks = useMemo(() => {
    return taskStore.tasks.filter((item) => item.state !== "completed");
  }, [taskStore.tasks]);
  const taskFinished = useMemo(() => {
    return taskStore.tasks.length > 0 && unfinishedTasks.length === 0;
  }, [taskStore.tasks, unfinishedTasks]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      suggestion: taskStore.suggestion,
    },
  });

  function getSearchResultContent(item: SearchTask) {
    return [
      `## ${item.query}`,
      `> ${item.researchGoal}`,
      "---",
      item.learning,
      item.sources?.length > 0
        ? `#### ${t("research.common.sources")}\n\n${item.sources
            .map(
              (source, idx) =>
                `${idx + 1}. [${source.title || source.url}][${idx + 1}]`
            )
            .join("\n")}`
        : "",
    ].join("\n\n");
  }

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    const { setSuggestion } = useTaskStore.getState();
    try {
      accurateTimerStart();
      setIsThinking(true);
      if (unfinishedTasks.length > 0) {
        await runSearchTask(unfinishedTasks);
      } else {
        if (values.suggestion) setSuggestion(values.suggestion);
        await reviewSearchResult();
        // Clear previous research suggestions
        setSuggestion("");
      }
    } finally {
      setIsThinking(false);
      accurateTimerStop();
    }
  }

  function addToKnowledgeBase(item: SearchTask) {
    const { save } = useKnowledgeStore.getState();
    const currentTime = Date.now();
    save({
      id: generateId("knowledge"),
      title: item.query,
      content: getSearchResultContent(item),
      type: "knowledge",
      createdAt: currentTime,
      updatedAt: currentTime,
    });
    toast.message(t("research.common.addToKnowledgeBaseTip"));
  }

  async function handleRetry(query: string, researchGoal: string) {
    const { updateTask } = useTaskStore.getState();
    const newTask: SearchTask = {
      query,
      researchGoal,
      learning: "",
      sources: [],
      state: "unprocessed",
    };
    updateTask(query, newTask);
    await runSearchTask([newTask]);
  }

  function handleRemove(query: string) {
    const { removeTask } = useTaskStore.getState();
    removeTask(query);
  }

  useEffect(() => {
    form.setValue("suggestion", taskStore.suggestion);
  }, [taskStore.suggestion, form]);

  return (
    <section className="p-6 border rounded-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm transition-all relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-chart-4 to-accent"></div>
      <h3 className="font-bold text-xl border-b pb-3 mb-4 leading-10">
        {t("research.searchResult.title")}
      </h3>
      {taskStore.tasks.length === 0 ? (
        <div className="text-muted-foreground text-center py-6">
          <TextSearch className="w-10 h-10 mx-auto mb-3 opacity-50" />
          {t("research.searchResult.emptyTip")}
        </div>
      ) : (
        <div>
          <Accordion className="mb-4" type="multiple">
            {taskStore.tasks.map((item, idx) => {
              return (
                <AccordionItem key={idx} value={item.query} className="border rounded-lg mb-3 overflow-hidden border-muted">
                  <AccordionTrigger className="px-4 py-2 hover:bg-secondary/5 transition-colors accordion-trigger">
                    <div className="flex items-center">
                      <div className={`p-1 rounded-full mr-2 ${
                        item.state === "completed" ? "bg-secondary/20 text-secondary" : 
                        item.state === "processing" ? "bg-primary/20 text-primary" : 
                        "bg-muted text-muted-foreground"
                      }`}>
                        <TaskState state={item.state} />
                      </div>
                      <span className="font-medium">{item.query}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="prose prose-slate dark:prose-invert max-w-full min-h-20 p-4 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm">
                    <MagicDownView>{`> ${item.researchGoal}`}</MagicDownView>
                    <Separator className="my-4" />
                    <MagicDown
                      value={item.learning}
                      onChange={(value) =>
                        taskStore.updateTask(item.query, { learning: value })
                      }
                      tools={
                        <>
                          <div className="px-1">
                            <Separator className="dark:bg-slate-700" />
                          </div>
                          <Button
                            className="float-menu-button text-chart-4 hover:text-chart-4 hover:bg-chart-4/10"
                            type="button"
                            size="icon"
                            variant="ghost"
                            title={t("research.common.restudy")}
                            side="left"
                            sideoffset={8}
                            onClick={() =>
                              handleRetry(item.query, item.researchGoal)
                            }
                          >
                            <RotateCcw />
                          </Button>
                          <Button
                            className="float-menu-button text-secondary hover:text-secondary hover:bg-secondary/10"
                            type="button"
                            size="icon"
                            variant="ghost"
                            title={t("research.common.addToKnowledgeBase")}
                            side="left"
                            sideoffset={8}
                            onClick={() => addToKnowledgeBase(item)}
                          >
                            <NotebookText />
                          </Button>
                          <Button
                            className="float-menu-button text-accent hover:text-accent hover:bg-accent/10"
                            type="button"
                            size="icon"
                            variant="ghost"
                            title={t("research.common.exportToMarkdown")}
                            side="left"
                            sideoffset={8}
                            onClick={() =>
                              downloadFile(
                                getSearchResultContent(item),
                                `${item.query}.md`,
                                "text/markdown;charset=utf-8"
                              )
                            }
                          >
                            <Download />
                          </Button>
                          <Button
                            className="float-menu-button text-destructive hover:text-destructive hover:bg-destructive/10"
                            type="button"
                            size="icon"
                            variant="ghost"
                            title={t("research.common.removeTask")}
                            side="left"
                            sideoffset={8}
                            onClick={() => handleRemove(item.query)}
                          >
                            <Trash />
                          </Button>
                        </>
                      }
                    />
                    {item.sources && item.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-bold text-sm mb-2 text-primary">
                          {t("research.common.sources")}
                        </h4>
                        <ul className="pl-6 list-disc text-sm leading-relaxed text-muted-foreground space-y-1">
                          {item.sources.map((source, idx) => (
                            <li key={idx}>
                              <a
                                href={source.url}
                                target="_blank"
                                className="break-all hover:text-primary transition-colors"
                              >
                                {source.title || source.url}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          {taskFinished ? (
            <FormField
              control={form.control}
              name="suggestion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="mb-2 text-base font-bold text-primary">
                    {t("research.searchResult.suggestionLabel")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder={t("research.searchResult.suggestionPlaceholder")}
                      className="rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          ) : null}
          <Button 
            className="w-full mt-4 rounded-lg font-medium text-base py-6 bg-gradient-to-r from-secondary to-chart-4 hover:shadow-md hover:shadow-secondary/20 hover:from-secondary hover:to-secondary transition-all" 
            disabled={isThinking} 
            type="submit"
          >
            {isThinking ? (
              <>
                <LoaderCircle className="animate-spin mr-2" />
                <span>{t("research.common.thinking")}</span>
                <small className="font-mono ml-2">{formattedTime}</small>
              </>
            ) : taskFinished ? (
              t("research.common.reviewSearchResult")
            ) : unfinishedTasks.length > 0 ? (
              t("research.common.continueSearch")
            ) : (
              t("research.common.startSearch")
            )}
          </Button>
        </form>
      </Form>
    </section>
  );
}

export default SearchResult;
