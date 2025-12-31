import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ParsedXML } from "./XMLImport";

interface Character {
  id: number;
  name: string;
  gender: string;
  appearance: string;
  clothing: string;
  expression: string;
  action: string;
  position: string;
}

interface GeneralTags {
  count: string;
  artists: string;
  style: string;
  background: string;
  lighting: string;
  atmosphere: string;
  objects: string;
  other: string;
}

interface StructuredPromptProps {
  onPromptChange: (prompt: string) => void;
  caption?: string;
  importedData?: ParsedXML | null;
}

const createEmptyCharacter = (id: number): Character => ({
  id,
  name: "",
  gender: "1girl",
  appearance: "",
  clothing: "",
  expression: "",
  action: "",
  position: "",
});

const defaultGeneralTags: GeneralTags = {
  count: "",
  artists: "",
  style: "",
  background: "",
  lighting: "",
  atmosphere: "",
  objects: "",
  other: "",
};

function generateXML(
  characters: Character[],
  generalTags: GeneralTags,
  caption?: string,
): string {
  let xml = "";

  characters.forEach((char, index) => {
    const charNum = index + 1;
    const charName = char.name.trim() || `character_${charNum}`;
    xml += `<character_${charNum}>\n`;
    xml += `<n>${charName}</n>\n`;
    if (char.gender) xml += `<gender>${char.gender}</gender>\n`;
    if (char.appearance) xml += `<appearance>${char.appearance}</appearance>\n`;
    if (char.clothing) xml += `<clothing>${char.clothing}</clothing>\n`;
    if (char.expression) xml += `<expression>${char.expression}</expression>\n`;
    if (char.action) xml += `<action>${char.action}</action>\n`;
    if (char.position) xml += `<position>${char.position}</position>\n`;
    xml += `</character_${charNum}>\n\n`;
  });

  const hasGeneralTags = Object.values(generalTags).some((v) => v.trim());
  if (hasGeneralTags) {
    xml += `<general_tags>\n`;
    if (generalTags.count) xml += `<count>${generalTags.count}</count>\n`;
    if (generalTags.artists)
      xml += `<artists>${generalTags.artists}</artists>\n`;
    if (generalTags.style) xml += `<style>${generalTags.style}</style>\n`;
    if (generalTags.background)
      xml += `<background>${generalTags.background}</background>\n`;
    if (generalTags.lighting)
      xml += `<lighting>${generalTags.lighting}</lighting>\n`;
    if (generalTags.atmosphere)
      xml += `<atmosphere>${generalTags.atmosphere}</atmosphere>\n`;
    if (generalTags.objects)
      xml += `<objects>${generalTags.objects}</objects>\n`;
    if (generalTags.other) xml += `<other>${generalTags.other}</other>\n`;
    xml += `</general_tags>`;
  }

  if (caption?.trim()) {
    xml += `\n\n<caption>${caption.trim()}</caption>`;
  }

  return xml.trim();
}

export function StructuredPrompt({
  onPromptChange,
  caption,
  importedData,
}: StructuredPromptProps) {
  const [characters, setCharacters] = useState<Character[]>([
    createEmptyCharacter(1),
  ]);
  const [generalTags, setGeneralTags] =
    useState<GeneralTags>(defaultGeneralTags);

  const updateAndNotify = (newChars: Character[], newTags: GeneralTags) => {
    onPromptChange(generateXML(newChars, newTags, caption));
  };

  // 当 caption 变化时更新
  useEffect(() => {
    onPromptChange(generateXML(characters, generalTags, caption));
  }, [caption]);

  // 当外部导入数据时填充
  useEffect(() => {
    if (importedData) {
      setCharacters(importedData.characters);
      setGeneralTags(importedData.generalTags);
      onPromptChange(
        generateXML(importedData.characters, importedData.generalTags, caption),
      );
    }
  }, [importedData]);

  const updateCharacter = (
    id: number,
    field: keyof Character,
    value: string,
  ) => {
    const newChars = characters.map((c) =>
      c.id === id ? { ...c, [field]: value } : c,
    );
    setCharacters(newChars);
    updateAndNotify(newChars, generalTags);
  };

  const addCharacter = () => {
    const newChars = [
      ...characters,
      createEmptyCharacter(characters.length + 1),
    ];
    setCharacters(newChars);
    updateAndNotify(newChars, generalTags);
  };

  const removeCharacter = (id: number) => {
    if (characters.length <= 1) return;
    const newChars = characters.filter((c) => c.id !== id);
    setCharacters(newChars);
    updateAndNotify(newChars, generalTags);
  };

  const updateGeneralTag = (field: keyof GeneralTags, value: string) => {
    const newTags = { ...generalTags, [field]: value };
    setGeneralTags(newTags);
    updateAndNotify(characters, newTags);
  };

  return (
    <div className="space-y-4">
      {/* 角色区域 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">角色</Label>
          <Button variant="outline" size="sm" onClick={addCharacter}>
            + 添加角色
          </Button>
        </div>

        {characters.map((char, index) => (
          <Card key={char.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">角色 {index + 1}</CardTitle>
                {characters.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCharacter(char.id)}
                    className="h-6 w-6 p-0 text-destructive"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">人物 &lt;n&gt;</Label>
                  <Input
                    value={char.name}
                    onChange={(e) =>
                      updateCharacter(char.id, "name", e.target.value)
                    }
                    placeholder="留空为原创角色"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">性别 &lt;gender&gt;</Label>
                  <Input
                    value={char.gender}
                    onChange={(e) =>
                      updateCharacter(char.id, "gender", e.target.value)
                    }
                    placeholder="1girl"
                    className="placeholder:text-muted-foreground/50 bg-muted/50"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">外观 &lt;appearance&gt;</Label>
                <Textarea
                  value={char.appearance}
                  onChange={(e) =>
                    updateCharacter(char.id, "appearance", e.target.value)
                  }
                  placeholder="red_eyes, blue_hair, long_hair..."
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">服装 &lt;clothing&gt;</Label>
                <Textarea
                  value={char.clothing}
                  onChange={(e) =>
                    updateCharacter(char.id, "clothing", e.target.value)
                  }
                  placeholder="school_uniform, serafuku..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">表情 &lt;expression&gt;</Label>
                  <Input
                    value={char.expression}
                    onChange={(e) =>
                      updateCharacter(char.id, "expression", e.target.value)
                    }
                    placeholder="happy, smile"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">位置 &lt;position&gt;</Label>
                  <Input
                    value={char.position}
                    onChange={(e) =>
                      updateCharacter(char.id, "position", e.target.value)
                    }
                    placeholder="center"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">动作 &lt;action&gt;</Label>
                <Input
                  value={char.action}
                  onChange={(e) =>
                    updateCharacter(char.id, "action", e.target.value)
                  }
                  placeholder="standing, holding..."
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 通用标签区域 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">通用标签</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">人数 &lt;count&gt;</Label>
              <Input
                value={generalTags.count}
                onChange={(e) => updateGeneralTag("count", e.target.value)}
                placeholder="1girl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">艺术家 &lt;artists&gt;</Label>
              <Input
                value={generalTags.artists}
                onChange={(e) => updateGeneralTag("artists", e.target.value)}
                placeholder="artist_name"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">画风 &lt;style&gt;</Label>
              <Input
                value={generalTags.style}
                onChange={(e) => updateGeneralTag("style", e.target.value)}
                placeholder="anime_style"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">背景 &lt;background&gt;</Label>
              <Input
                value={generalTags.background}
                onChange={(e) => updateGeneralTag("background", e.target.value)}
                placeholder="white_background"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">氛围 &lt;atmosphere&gt;</Label>
              <Input
                value={generalTags.atmosphere}
                onChange={(e) => updateGeneralTag("atmosphere", e.target.value)}
                placeholder="cheerful"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">光影 &lt;lighting&gt;</Label>
              <Input
                value={generalTags.lighting}
                onChange={(e) => updateGeneralTag("lighting", e.target.value)}
                placeholder="soft_lighting"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">物品 &lt;objects&gt;</Label>
              <Input
                value={generalTags.objects}
                onChange={(e) => updateGeneralTag("objects", e.target.value)}
                placeholder="briefcase"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">其他 &lt;other&gt;</Label>
              <Input
                value={generalTags.other}
                onChange={(e) => updateGeneralTag("other", e.target.value)}
                placeholder="alternate_costume"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
