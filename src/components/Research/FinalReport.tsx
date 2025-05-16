"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Download,
  FileText,
  Signature,
  LoaderCircle,
  NotebookText,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/Internal/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import useAccurateTimer from "@/hooks/useAccurateTimer";
import useDeepResearch from "@/hooks/useDeepResearch";
import useKnowledge from "@/hooks/useKnowledge";
import { useTaskStore } from "@/store/task";
import { useKnowledgeStore } from "@/store/knowledge";
import { getSystemPrompt } from "@/utils/deep-research";
import { downloadFile } from "@/utils/file";

const MagicDown = dynamic(() => import("@/components/MagicDown"));
const Artifact = dynamic(() => import("@/components/Artifact"));

const formSchema = z.object({
  requirement: z.string().optional(),
});

function FinalReport() {
  const { t } = useTranslation();
  const taskStore = useTaskStore();
  const { status, writeFinalReport } = useDeepResearch();
  const { generateId } = useKnowledge();
  const {
    formattedTime,
    start: accurateTimerStart,
    stop: accurateTimerStop,
  } = useAccurateTimer();
  const [isWriting, setIsWriting] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requirement: taskStore.requirement,
    },
  });

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    const { setRequirement } = useTaskStore.getState();
    try {
      accurateTimerStart();
      setIsWriting(true);
      if (values.requirement) setRequirement(values.requirement);
      await writeFinalReport();
    } finally {
      setIsWriting(false);
      accurateTimerStop();
    }
  }

  function getFinakReportContent() {
    const { finalReport, resources, sources } = useTaskStore.getState();

    return [
      finalReport,
      resources.length > 0
        ? [
            "---",
            `## ${t("research.finalReport.localResearchedInfor", {
              total: resources.length,
            })}`,
            `${resources
              .map((source, idx) => `${idx + 1}. ${source.name}`)
              .join("\n")}`,
          ].join("\n")
        : "",
      sources.length > 0
        ? [
            "---",
            `## ${t("research.finalReport.researchedInfor", {
              total: sources.length,
            })}`,
            `${sources
              .map(
                (source, idx) =>
                  `${idx + 1}. [${source.title || source.url}][${idx + 1}]`
              )
              .join("\n")}`,
          ].join("\n")
        : "",
    ].join("\n\n");
  }

  function addToKnowledgeBase() {
    const { title } = useTaskStore.getState();
    const { save } = useKnowledgeStore.getState();
    const currentTime = Date.now();
    save({
      id: generateId("knowledge"),
      title,
      content: getFinakReportContent(),
      type: "knowledge",
      createdAt: currentTime,
      updatedAt: currentTime,
    });
    toast.message(t("research.common.addToKnowledgeBaseTip"));
  }

  async function handleDownloadPDF() {
    const originalTitle = document.title;
    document.title = taskStore.title;
    window.print();
    document.title = originalTitle;
  }

  useEffect(() => {
    form.setValue("requirement", taskStore.requirement);
  }, [taskStore.requirement, form]);

  return (
    <section className="p-6 border rounded-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm transition-all relative overflow-hidden mb-6">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-chart-1 via-chart-5 to-primary"></div>
      <h3 className="font-bold text-xl border-b pb-3 mb-4 leading-10">
        {t("research.finalReport.title")}
      </h3>
      {taskStore.finalReport !== "" ? (
        <>
          <div className="rounded-xl border border-muted p-4 bg-white/30 dark:bg-slate-800/30">
            <MagicDown
              className="min-h-72"
              value={taskStore.finalReport}
              onChange={(value) => taskStore.updateFinalReport(value)}
              tools={
                <>
                  <div className="px-1">
                    <Separator className="dark:bg-slate-700" />
                  </div>
                  <Artifact
                    value={taskStore.finalReport}
                    systemInstruction={getSystemPrompt()}
                    onChange={taskStore.updateFinalReport}
                    buttonClassName="float-menu-button"
                    dropdownMenuSideOffset={8}
                    tooltipSideOffset={8}
                  />
                  <div className="px-1">
                    <Separator className="dark:bg-slate-700" />
                  </div>
                  <Button
                    className="float-menu-button text-secondary hover:text-secondary hover:bg-secondary/10"
                    type="button"
                    size="icon"
                    variant="ghost"
                    title={t("research.common.addToKnowledgeBase")}
                    side="left"
                    sideoffset={8}
                    onClick={() => addToKnowledgeBase()}
                  >
                    <NotebookText />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="float-menu-button text-chart-4 hover:text-chart-4 hover:bg-chart-4/10"
                        type="button"
                        size="icon"
                        variant="ghost"
                        title={t("research.common.export")}
                        side="left"
                        sideoffset={8}
                      >
                        <Download />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="rounded-lg shadow-lg">
                      <DropdownMenuItem
                        onClick={() =>
                          downloadFile(
                            getFinakReportContent(),
                            `${taskStore.title}.md`,
                            "text/markdown;charset=utf-8"
                          )
                        }
                        className="rounded-md"
                      >
                        <FileText className="h-4 w-4 mr-2 text-primary" />
                        <span>{t("research.common.markdown")}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadPDF()} className="rounded-md">
                        <Signature className="h-4 w-4 mr-2 text-accent" />
                        <span>{t("research.common.pdf")}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              }
            />
          </div>
          <div className="flex-wrap hidden print:block">
            <article className="prose prose-slate dark:prose-invert max-w-full">
              <MagicDown value={taskStore.finalReport} onChange={() => {}} />
              {taskStore.resources.length > 0 ? (
                <>
                  <hr className="my-6" />
                  <h2>
                    {t("research.finalReport.localResearchedInfor", {
                      total: taskStore.resources.length,
                    })}
                  </h2>
                  <ul>
                    {taskStore.resources.map((resource) => {
                      return <li key={resource.id}>{resource.name}</li>;
                    })}
                  </ul>
                </>
              ) : null}
              {taskStore.sources?.length > 0 ? (
                <>
                  <hr className="my-6" />
                  <h2>
                    {t("research.finalReport.researchedInfor", {
                      total: taskStore.sources.length,
                    })}
                  </h2>
                  <ol>
                    {taskStore.sources.map((source, idx) => {
                      return (
                        <li key={idx}>
                          <a href={source.url} target="_blank">
                            {source.title || source.url}
                          </a>
                        </li>
                      );
                    })}
                  </ol>
                </>
              ) : null}
            </article>
          </div>
        </>
      ) : taskStore.reportPlan !== "" ? (
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <FormField
                control={form.control}
                name="requirement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-2 text-base font-bold text-primary">
                      {t("research.finalReport.requirement")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder={t("research.finalReport.requirementPlaceholder")}
                        disabled={isWriting}
                        className="rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                className="w-full mt-4 rounded-lg font-medium text-base py-6 bg-gradient-to-r from-primary to-chart-5 hover:shadow-md hover:shadow-primary/20 hover:from-primary hover:to-primary transition-all"
                disabled={isWriting}
                type="submit"
              >
                {isWriting ? (
                  <>
                    <LoaderCircle className="animate-spin mr-2" />
                    <span>{status}</span>
                    <small className="font-mono ml-2">{formattedTime}</small>
                  </>
                ) : (
                  t("research.common.writeReport")
                )}
              </Button>
            </form>
          </Form>
        </div>
      ) : (
        <div className="text-muted-foreground text-center py-6">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
          {t("research.finalReport.emptyTip")}
        </div>
      )}
    </section>
  );
}

export default FinalReport;
