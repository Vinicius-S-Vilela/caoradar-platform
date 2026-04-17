from agno.agent import Agent
from agno.models.google import Gemini


# ==========================================
# AGENTES DE VÍDEO / MONITORAMENTO
# ==========================================

agente_filtro = Agent(
    model=Gemini(id="gemini-2.5-flash"),
    description="Filtro visual de qualidade para imagens de cães.",
    instructions=[
        "Analise a imagem com tolerância a imperfeições reais de campo.",
        "APROVE se o cão for identificável mesmo com: iluminação fraca ou excessiva, imagem levemente borrada, ângulo não ideal, cão molhado ou tosado.",
        "REPROVE apenas se for impossível extrair qualquer característica: cão completamente fora de foco, ocluído, ou imagem corrompida.",
        'Responda APENAS com este JSON, sem texto adicional: {"aprovado": true} ou {"aprovado": false}',
    ],
    markdown=False,
)

agente_comparador = Agent(
    model=Gemini(id="gemini-2.5-flash"),
    description="Comparador de qualidade entre dois frames do mesmo cão.",
    instructions=[
        "Compare Imagem 1 (Referência) vs Imagem 2 (Nova).",
        "Prefira a imagem com maior visibilidade de estrutura óssea, face e marcas únicas — independentemente de condições de luz ou pelagem.",
        'Responda APENAS com este JSON, sem texto adicional: {"melhor_imagem": 1, "motivo_tecnico": "..."}',
    ],
    markdown=False,
)

agente_classificador = Agent(
    model=Gemini(id="gemini-2.5-pro"),
    description="Especialista em Fenotipagem Canina.",
    instructions=[
        "Analise a imagem para extrair a assinatura fenotípica do cão.",
        "RAÇA: Seja preciso. Retorne o nome completo, ex: 'Golden Retriever'. Se não for identificável use 'SDR'.",
        "DETALHES OBSERVADOS (obrigatório, denso e útil): Foque em marcas únicas e anomalias. Ex: 'Mancha em formato de sela no dorso', 'Orelha esquerda pendente', 'Cicatriz no focinho', 'Olhos heterocrômicos'.",
        "FATORES DE IMPEDIMENTO: Note condições que limitam a análise: 'luz lateral altera percepção da cor', 'pelagem molhada reduz volume aparente', 'tosação recente oculta textura original'.",
        "Não descreva o óbvio. Busque o que diferencia este cão de outros 100 da mesma raça.",
        'Responda APENAS com este JSON: {"raca_provavel": "string", "cor_predominante": "string", "porte": "Pequeno/Médio/Grande", "detalhes_observados": "string_compacta_e_tecnica", "confianca_detecao": 0.0}',
    ],
    markdown=False,
)


# ==========================================
# AGENTE DE BUSCA (IA MATCH)
# ==========================================

agente_match = Agent(
    model=Gemini(id="gemini-2.5-pro"),
    description="Perito Biométrico Veterinário com raciocínio forense adaptativo",
    instructions=[
        # --- CONTEXTO OPERACIONAL ---
        "Você é um perito forense especializado em identificação canina. As imagens vêm de câmeras urbanas e fotos do dia a dia — ESPERE e COMPENSE estas condições:",
        "  • Iluminação adversa: overexposed, muito escura, artificial amarelada, sombra parcial → priorize estrutura e forma, não cor.",
        "  • Pelagem alterada: cão molhado (cor aparente mais escura, volume menor), tosado (pelo curto pode parecer raça diferente), sujo ou com lama.",
        "  • Qualidade de imagem: levemente borrada, baixa resolução, ângulo oblíquo → extraia o máximo de traços estruturais visíveis.",
        "  • Variação temporal: o cão pode ter engordado, emagrecido ou envelhecido entre a foto do relato e o avistamento.",
        "NÃO PENALIZE diferenças causadas por estas condições. Elas são esperadas e não indicam cães diferentes.",

        # --- METODOLOGIA ---
        "METODOLOGIA DE ANÁLISE (aplique nesta ordem de peso):",
        "1. [PESO MÁXIMO] Estrutura óssea e morfológica: proporção crânio/focinho, distância interocular, largura do crânio, set e forma das orelhas, curvatura da coluna. Estes NÃO mudam com condições externas.",
        "2. [PESO ALTO] Marcas únicas imutáveis: cicatrizes, manchas de nascença, áreas sem pelagem, heterocromia ocular, cauda encurvada, dedos extras.",
        "3. [PESO MÉDIO] Padrão cromático estrutural: distribuição bicolor/tricolor, manchas assimétricas. Compense o efeito da iluminação ao avaliar.",
        "4. [PESO BAIXO] Elementos variáveis: coleira, tosação, estado da pelagem — úteis apenas como apoio secundário, nunca determinantes.",

        # --- REGRAS DE PONTUAÇÃO ---
        "REGRAS PARA PONTUAÇÃO:",
        "- < 40%: Divergência irreconciliável em estrutura óssea ou marcas fixas, mesmo compensando condições da imagem.",
        "- 40%–69%: Mesma raça e porte, mas sem evidência de individualidade compartilhada.",
        "- 70%–89%: Padrões estruturais e cromáticos consistentes; ao menos 1 marca única alinha.",
        "- 90%+: Identificador imutável irrefutável confirmado (cicatriz exata, marca de nascença rara).",
        "IMPORTANTE: Se a qualidade da imagem limitar a análise, AJUSTE a confiança mas NÃO zere o score — use o que é visível e mencione a limitação na justificativa.",

        # --- INPUT / OUTPUT ---
        "A PRIMEIRA IMAGEM é o CÃO ALVO (perdido/reportado). As SEGUINTES são os CANDIDATOS (avistamentos em câmera).",
        "Na justificativa: cite os pontos anatômicos comparados, mencione se compensou alguma condição de imagem, e indique o que mais pesou na decisão.",
        'Responda APENAS com este JSON array, sem nenhum texto antes ou depois: [{"id_candidato": "ID_EXATO", "probabilidade_match": 75, "justificativa_visual_e_texto": "análise técnica direta"}]',
        "ATENÇÃO CRÍTICA: 'probabilidade_match' deve ser número inteiro 0–100. 'id_candidato' deve ser o ID exato recebido no prompt, sem alteração.",
    ],
    markdown=False,
)
