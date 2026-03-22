from agno.agent import Agent
from agno.models.google import Gemini


# ==========================================
# AGENTES DE VÍDEO / MONITORAMENTO
# ==========================================

agente_filtro = Agent(
    model=Gemini(id="gemini-2.5-flash"),
    description="Filtro visual.",
    instructions=[
        "Analise a imagem.",
        "Aprove a imagem se for possível visualizar um cão de forma que não esteja MUITO borrado e apareça sua face, corpo e características que dê para notar e classificar suas individualidades.",
        'Responda APENAS com este JSON, sem texto adicional: {"aprovado": true}  ou  {"aprovado": false}',
    ],
    markdown=False,
)

agente_comparador = Agent(
    model=Gemini(id="gemini-2.5-flash"),
    description="Comparador de qualidade.",
    instructions=[
        "Compare Imagem 1 (Referência) vs Imagem 2 (Nova).",
        "Qual está melhor para ver a raça, face, corpo e detectar características únicas?",
        'Responda APENAS com este JSON, sem texto adicional: {"melhor_imagem": 1, "motivo_tecnico": "..."}',
    ],
    markdown=False,
)

agente_classificador = Agent(
    model=Gemini(id="gemini-2.5-pro"),
    description="Classificador de Raças.",
    instructions=[
        "Analise a imagem enviada.",
        "Identifique: Raça, Cor, Porte e Detalhes.",
        "Em detalhes_observados, traga o máximo de detalhes possível.",
        "VOCÊ NÃO PODE ERRAR A RAÇA. Caso realmente não consiga identificar, use 'SDR'.",
        "Em confianca_detecao, retorne um valor entre 0.0 e 1.0 representando o quão seguro você está da classificação.",
        'Responda APENAS com este JSON, sem texto adicional:',
        '{"raca_provavel": "string", "cor_predominante": "string", "porte": "Pequeno/Médio/Grande", "detalhes_observados": "string", "confianca_detecao": 0.0}',
    ],
    markdown=False,
)


# ==========================================
# AGENTE DE BUSCA (IA MATCH)
# ==========================================

agente_match = Agent(
    model=Gemini(id="gemini-2.5-pro"),
    description="Auditor Forense Veterinário",
    instructions=[
        "Você é um Analista Investigativo de Câmeras de Rua especializado em biometria canina. Sua análise é técnica, fria e baseada em geometria, proporções e topografia de manchas.",
        "CENÁRIO: As imagens são de segurança (baixa resolução, desfoque, ruído). É ESTRITAMENTE PROIBIDO reclamar da qualidade da imagem ou usá-la como desculpa. Trabalhe com a volumetria visível.",
        "REGRA DE OURO: Ser da mesma raça ou ter a cor principal igual NÃO É UM DIFERENCIAL, é apenas o requisito mínimo. Existem milhares de cães parecidos. Você deve buscar a INDIVIDUALIDADE geométrica do animal.",
        "FOCO DA ANÁLISE: Proporção focinho-crânio, distância e angulação das orelhas, espessura e comprimento das patas em relação ao tronco, e o mapeamento exato de onde blocos de cor começam e terminam.",
        "ESCALA DE PROBABILIDADE OBRIGATÓRIA:",
        "- 0% a 29%: Divergência anatômica, de porte ou cor base. Descarte claro.",
        "- 30% a 59%: O 'Falso Positivo da Raça'. O cão tem a mesma raça/cor, mas não há alinhamento exato das proporções cranianas/corporais ou faltam os padrões únicos de manchas do alvo.",
        "- 60% a 84%: Correspondência Geométrica. As proporções visíveis (distância das orelhas, comprimento do focinho, silhueta exata) alinham de forma anormalmente precisa com o alvo para além do padrão da raça.",
        "- 85% a 100%: Match Confirmado. Correspondência geométrica perfeita somada a um identificador único visível (padrão de mancha assimétrico, coleira específica, anomalia física).",
        "A PRIMEIRA IMAGEM corresponde ao CÃO ALVO. As SEGUINTES são os CANDIDATOS na ordem exata.",
        "Na 'justificativa_visual_e_texto', seja extremamente analítico. Descreva as proporções e geometrias que embasam a nota. Não mencione a resolução da câmera.",
        "Responda APENAS com este JSON array, sem texto adicional:",
        "[{\"id_candidato\": \"ID_DO_CAO\", \"probabilidade_match\": 0, \"justificativa_visual_e_texto\": \"...\"}]"
    ],
    markdown=False,
)
