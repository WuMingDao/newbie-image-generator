import { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneratedImages } from "./GeneratedImages";
import { StructuredPrompt } from "./StructuredPrompt";
import { XMLImport, type ParsedXML } from "./XMLImport";
import { api } from "@/lib/api";
import { getComfyUIUrl, setComfyUIUrl } from "@/lib/config";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { ImageResult, WSMessage } from "@/lib/types";

interface GenerationParams {
  prompt: string;
  negativePrompt: string;
  steps: number;
  cfgScale: number;
  width: number;
  height: number;
  seed: number;
  samplerName: string;
  scheduler: string;
  hifixEnabled: boolean;
  hifixSteps: number;
  hifixCfg: number;
}

const DEFAULT_NEGATIVE_PROMPT =
  "low quality, blurry, distorted, deformed, ugly, bad anatomy";

const DEFAULT_SYSTEM_PROMPT =
  "You are the greatest anime artist in the entire universe. Your figures are always clear, especially in facial detail. Your compositions always adhere to the golden ratio. Your perspectives are perfectly chosen. The scenes in your works always fit the setting. Your lighting is particularly atmospheric.Now draw a picture based on the prompts below.You are an assistant designed to generate anime images based on xml format textual prompts.";

export function ImageGenerator() {
  const [params, setParams] = useState<GenerationParams>({
    prompt: "",
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
    steps: 28,
    cfgScale: 4.5,
    width: 1024,
    height: 1536,
    seed: -1,
    samplerName: "res_multistep",
    scheduler: "linear_quadratic",
    hifixEnabled: false,
    hifixSteps: 20,
    hifixCfg: 7,
  });

  const [promptMode, setPromptMode] = useState<"normal" | "structured">(() => {
    return (
      (localStorage.getItem("promptMode") as "normal" | "structured") ||
      "normal"
    );
  });
  const [systemPrompt, setSystemPrompt] = useState(() => {
    return localStorage.getItem("systemPrompt") || DEFAULT_SYSTEM_PROMPT;
  });
  const [systemPromptOpen, setSystemPromptOpen] = useState(false);
  const [structuredPrompt, setStructuredPrompt] = useState("");
  const [caption, setCaption] = useState(() => {
    return localStorage.getItem("caption") || "";
  });
  const [importedData, setImportedData] = useState<ParsedXML | null>(null);

  const handleXMLImport = (data: ParsedXML) => {
    setImportedData(data);
    if (data.caption) {
      setCaption(data.caption);
    }
    setPromptMode("structured");
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentNode, setCurrentNode] = useState<string>("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<ImageResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [comfyuiUrl, setComfyuiUrlState] = useState(getComfyUIUrl());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(
    null,
  );

  // 保存到 localStorage
  useEffect(() => {
    localStorage.setItem("promptMode", promptMode);
  }, [promptMode]);

  useEffect(() => {
    localStorage.setItem("systemPrompt", systemPrompt);
  }, [systemPrompt]);

  useEffect(() => {
    localStorage.setItem("caption", caption);
  }, [caption]);

  const handleComfyUIUrlChange = (url: string) => {
    setComfyuiUrlState(url);
    setComfyUIUrl(url);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    handleComfyUIUrlChange(comfyuiUrl);
    try {
      let url = comfyuiUrl.trim();
      if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
        url = `http://${url}`;
      }
      const result = await api.testComfyUI(url);
      setTestResult(result.success ? "success" : "error");
    } catch {
      setTestResult("error");
    } finally {
      setTestingConnection(false);
      setTimeout(() => setTestResult(null), 3000);
    }
  };

  const handleWSMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case "started":
        setIsGenerating(true);
        setProgress(0);
        setError(null);
        break;

      case "progress":
        setProgress(message.percentage);
        setCurrentNode(message.node);
        break;

      case "preview":
        setPreviewImage(message.image_data);
        break;

      case "completed":
        setIsGenerating(false);
        setProgress(100);
        setPreviewImage(null);
        setGeneratedImages((prev) => [...message.images, ...prev]);
        setTimeout(() => setProgress(0), 500);
        break;

      case "error":
        setIsGenerating(false);
        setProgress(0);
        setError(message.message);
        setPreviewImage(null);
        break;
    }
  }, []);

  const { isConnected } = useWebSocket({
    onMessage: handleWSMessage,
  });

  // 构建最终 prompt
  const buildFinalPrompt = (): string => {
    const userPrompt =
      promptMode === "normal" ? params.prompt : structuredPrompt;
    return `${systemPrompt}\n<Prompt Start>,${userPrompt}`;
  };

  const handleGenerate = async () => {
    const userPrompt =
      promptMode === "normal" ? params.prompt : structuredPrompt;
    if (!userPrompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setPreviewImage(null);

    const finalPrompt = buildFinalPrompt();

    try {
      const response = await api.generate({
        prompt: finalPrompt,
        negative_prompt: params.negativePrompt,
        width: params.width,
        height: params.height,
        steps: params.steps,
        cfg: params.cfgScale,
        seed: params.seed,
        sampler_name: params.samplerName,
        scheduler: params.scheduler,
      });

      console.log("Prompt queued:", response.prompt_id);

      const pollInterval = setInterval(async () => {
        try {
          const history = await api.history(response.prompt_id);
          if (history.images && history.images.length > 0) {
            clearInterval(pollInterval);
            setIsGenerating(false);
            setProgress(100);
            setGeneratedImages((prev) => [...history.images, ...prev]);
            setTimeout(() => setProgress(0), 500);
          }
        } catch {
          // Still processing
        }
      }, 1000);

      setTimeout(() => {
        clearInterval(pollInterval);
        if (isGenerating) {
          setIsGenerating(false);
          setError("Generation timed out");
        }
      }, 300000);
    } catch (err) {
      setIsGenerating(false);
      setError(err instanceof Error ? err.message : "Generation failed");
    }
  };

  const handleInterrupt = async () => {
    try {
      await api.interrupt();
      setIsGenerating(false);
      setProgress(0);
    } catch (err) {
      console.error("Failed to interrupt:", err);
    }
  };

  const handleRandomSeed = () => {
    setParams({ ...params, seed: Math.floor(Math.random() * 1000000000) });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left control panel */}
      <div className="lg:col-span-1 space-y-4 overflow-y-auto">
        {/* System Prompt 折叠区域 */}
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => setSystemPromptOpen(!systemPromptOpen)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                {systemPromptOpen ? "▼" : "▶"} System Prompt
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {systemPromptOpen ? "点击收起" : "点击展开"}
              </Badge>
            </div>
          </CardHeader>
          {systemPromptOpen && (
            <CardContent>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={5}
                className="text-xs"
              />
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
              >
                重置为默认
              </Button>
            </CardContent>
          )}
        </Card>

        {/* 自然语言描述 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">自然语言描述</CardTitle>
            <CardDescription className="text-xs">
              用自然语言描述画面，会添加到 prompt 最后
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="例如：一个女孩站在樱花树下，阳光透过花瓣洒落..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* XML 导入 */}
        <XMLImport onImport={handleXMLImport} />

        {/* Prompt 区域 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Prompt
                </CardTitle>
                <CardDescription>描述你想生成的图像</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSettingsOpen(!settingsOpen)}
              >
                ⚙️ ComfyUI URL
              </Button>
            </div>
            {settingsOpen && (
              <div className="mt-4 p-3 rounded-md border bg-muted/50 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                  />
                  {isConnected ? "已连接服务器" : "未连接"}
                </div>
                <div className="space-y-2">
                  <Label>ComfyUI URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={comfyuiUrl}
                      onChange={(e) => handleComfyUIUrlChange(e.target.value)}
                      placeholder="http://127.0.0.1:8188"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTestConnection}
                      disabled={testingConnection}
                    >
                      {testingConnection ? "测试中..." : "测试"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ComfyUI 服务器地址，用于加载图片
                  </p>
                  {testResult && (
                    <p
                      className={`text-xs ${testResult === "success" ? "text-green-500" : "text-red-500"}`}
                    >
                      {testResult === "success" ? "✓ 连接成功" : "✗ 连接失败"}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 模式切换 Tabs */}
            <Tabs
              value={promptMode}
              onValueChange={(v) => setPromptMode(v as "normal" | "structured")}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="normal">普通模式</TabsTrigger>
                <TabsTrigger value="structured">结构模式</TabsTrigger>
              </TabsList>

              <TabsContent value="normal" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Positive Prompt</Label>
                  <Textarea
                    placeholder="e.g., 1girl, blue eyes, white hair, school uniform, masterpiece, best quality"
                    value={params.prompt}
                    onChange={(e) =>
                      setParams({ ...params, prompt: e.target.value })
                    }
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </TabsContent>

              <TabsContent value="structured" className="mt-4">
                <StructuredPrompt
                  onPromptChange={setStructuredPrompt}
                  caption={caption}
                  importedData={importedData}
                />
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="space-y-2">
              <Label>Negative Prompt</Label>
              <Textarea
                placeholder="Things to avoid in the image"
                value={params.negativePrompt}
                onChange={(e) =>
                  setParams({ ...params, negativePrompt: e.target.value })
                }
                rows={3}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generation Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Steps</Label>
                <Badge variant="secondary">{params.steps}</Badge>
              </div>
              <Slider
                value={[params.steps]}
                onValueChange={(value) =>
                  setParams({ ...params, steps: value[0] })
                }
                min={10}
                max={100}
                step={1}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>CFG Scale</Label>
                <Badge variant="secondary">{params.cfgScale}</Badge>
              </div>
              <Slider
                value={[params.cfgScale]}
                onValueChange={(value) =>
                  setParams({ ...params, cfgScale: value[0] })
                }
                min={1}
                max={20}
                step={0.5}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Width</Label>
                <Input
                  type="number"
                  value={params.width}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      width: parseInt(e.target.value) || 1024,
                    })
                  }
                  min={256}
                  max={4096}
                  step={64}
                />
              </div>
              <div className="space-y-2">
                <Label>Height</Label>
                <Input
                  type="number"
                  value={params.height}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      height: parseInt(e.target.value) || 1536,
                    })
                  }
                  min={256}
                  max={4096}
                  step={64}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Seed</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={params.seed}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      seed: parseInt(e.target.value) || -1,
                    })
                  }
                  placeholder="-1 for random"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRandomSeed}
                >
                  🎲
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Sampler</Label>
              <Select
                value={params.samplerName}
                onValueChange={(value) =>
                  setParams({ ...params, samplerName: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="res_multistep">Res Multistep</SelectItem>
                  <SelectItem value="res_momentumized">
                    Res Momentumized
                  </SelectItem>
                  <SelectItem value="euler">Euler</SelectItem>
                  <SelectItem value="euler_ancestral">
                    Euler Ancestral
                  </SelectItem>
                  <SelectItem value="dpmpp_2m">DPM++ 2M</SelectItem>
                  <SelectItem value="dpmpp_2m_sde">DPM++ 2M SDE</SelectItem>
                  <SelectItem value="dpmpp_3m_sde">DPM++ 3M SDE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Scheduler</Label>
              <Select
                value={params.scheduler}
                onValueChange={(value) =>
                  setParams({ ...params, scheduler: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear_quadratic">
                    Linear Quadratic
                  </SelectItem>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="karras">Karras</SelectItem>
                  <SelectItem value="exponential">Exponential</SelectItem>
                  <SelectItem value="sgm_uniform">SGM Uniform</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between opacity-50">
                <Label
                  htmlFor="hifix-toggle"
                  className="flex items-center gap-2"
                >
                  HiFix Enhancement
                  <Badge variant="outline" className="text-xs">
                    开发中
                  </Badge>
                </Label>
                <Switch
                  id="hifix-toggle"
                  checked={params.hifixEnabled}
                  onCheckedChange={(checked) =>
                    setParams({ ...params, hifixEnabled: checked })
                  }
                  disabled
                />
              </div>

              {params.hifixEnabled && (
                <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>HiFix Steps</Label>
                      <Badge variant="secondary">{params.hifixSteps}</Badge>
                    </div>
                    <Slider
                      value={[params.hifixSteps]}
                      onValueChange={(value) =>
                        setParams({ ...params, hifixSteps: value[0] })
                      }
                      min={5}
                      max={50}
                      step={1}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>HiFix CFG</Label>
                      <Badge variant="secondary">{params.hifixCfg}</Badge>
                    </div>
                    <Slider
                      value={[params.hifixCfg]}
                      onValueChange={(value) =>
                        setParams({ ...params, hifixCfg: value[0] })
                      }
                      min={1}
                      max={20}
                      step={0.5}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Generate / Interrupt button - 悬浮按钮 */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-2">
          <Button
            className="shadow-lg px-8"
            size="lg"
            onClick={handleGenerate}
            disabled={
              isGenerating ||
              !(promptMode === "normal"
                ? params.prompt.trim()
                : structuredPrompt.trim()) ||
              !isConnected
            }
          >
            {isGenerating ? (
              <>
                Generating
                <span className="inline-flex ml-1">
                  <span className="animate-[bounce_1s_infinite_0ms]">.</span>
                  <span className="animate-[bounce_1s_infinite_200ms]">.</span>
                  <span className="animate-[bounce_1s_infinite_400ms]">.</span>
                </span>
              </>
            ) : (
              "Generate Image"
            )}
          </Button>
          {isGenerating && (
            <Button
              className="shadow-lg"
              size="lg"
              variant="destructive"
              onClick={handleInterrupt}
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Progress */}
        {isGenerating && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    {currentNode || "Processing..."}
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview */}
        {previewImage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={previewImage}
                alt="Preview"
                className="w-full rounded-lg"
              />
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right image display area */}
      <div className="lg:col-span-2 overflow-y-auto">
        <GeneratedImages images={generatedImages} previewImage={previewImage} />
      </div>
    </div>
  );
}
