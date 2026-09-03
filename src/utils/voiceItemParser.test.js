import { parseVoiceItemTranscript } from "./voiceItemParser";

describe("parseVoiceItemTranscript", () => {
  it("interpreta um produto com preço brasileiro, estoque e categoria", () => {
    expect(parseVoiceItemTranscript(
      "produto Cola Tudo preço 23,90 estoque 12 categoria ferramentas marca Condor descrição cola de alta aderência status ativo"
    )).toEqual(expect.objectContaining({
      name: "Cola Tudo",
      type: "product",
      price: "23.90",
      stock: "12",
      category: "ferramentas",
      brand: "Condor",
      description: "cola de alta aderência",
      status: 1,
    }));
  });

  it("interpreta um serviço e sua duração", () => {
    expect(parseVoiceItemTranscript(
      "serviço Corte masculino preço 45 duração 30 categoria Barbearia status ativo"
    )).toEqual(expect.objectContaining({
      name: "Corte masculino",
      type: "service",
      price: "45",
      duration: "30",
      category: "Barbearia",
      status: 1,
    }));
  });

  it("interpreta status inativo", () => {
    expect(parseVoiceItemTranscript("produto Telha de fibra preço 79,90 status inativo"))
      .toEqual(expect.objectContaining({ status: 0 }));
  });
});
