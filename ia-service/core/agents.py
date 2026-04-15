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
    description="Especialista em Fenotipagem Canina.",
    instructions=[
        "Analise a imagem para extrair a assinatura fenotípica do espécime.",
        "RAÇA: Seja preciso. E retorne o nome da raça, ex: Golden deve ser Golden Retriever não só Golden, se não for possivel encontrar use 'SDR'",
        "DETALHES OBSERVADOS (Obrigatório ser denso e útil): Foque em anomalias e marcas únicas. Exemplos: 'Mancha em formato de sela no dorso', 'Orelha esquerda pendente', 'Cicatriz no focinho', 'Uso de coleira peitoral azul', 'Postura de guarda', 'Olhos heterocrômicos'.",
        "Fatores de Impedimento: Mencione se o ângulo da foto esconde o lado direito, se a luz amarela altera a percepção da cor, etc.",
        "Não narre o óbvio como 'tem quatro patas'. Busque o que separa este cão de outros 100 da mesma raça.",
        'Responda APENAS com este JSON: {"raca_provavel": "string", "cor_predominante": "string", "porte": "Pequeno/Médio/Grande", "detalhes_observados": "string_compacta_e_tecnica", "confianca_detecao": 0.0}',
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
        "Você é um perito biométrico. Sua missão é evitar o 'Falso Positivo' a todo custo. Um erro aqui significa dar falsas esperanças sobre um cão errado para uma família.",
        "METODOLOGIA DE ANÁLISE:",
        "1. Pontos de Ancoragem: Compare a distância interocular relativa ao comprimento do focinho.",
        "2. Topografia de Manchas: Verifique a continuidade de padrões. Se o alvo tem uma mancha branca na pata que o candidato não tem, o match é ZERO, independentemente da raça.",
        "3. Análise de Contexto: Considere os 'detalhes_observados' (coleiras, sequelas, marcas únicas).",
        "REGRAS PARA PONTUAÇÃO:",
        "- < 40%: Divergência em marcas fixas ou proporções ósseas visíveis.",
        "- 40%-69%: Semelhança genérica (mesma raça/cor), mas sem provas de individualidade.",
        "- 70%-89%: Coincidência de padrões complexos (manchas assimétricas batem perfeitamente).",
        "- 90%+: Identificador único irrefutável (cicatriz exata, marca de nascença rara ou acessório idêntico).",
        "A PRIMEIRA IMAGEM é o ALVO. As SEGUINTES são os CANDIDATOS.",
        "Na justificativa, use termos como 'Alinhamento de eixos faciais', 'Divergência de padrão cromático' ou 'Convergência de marcas únicas'.",
        'Responda APENAS com este JSON array: [{"id_candidato": "ID", "probabilidade_match": 0.0, "justificativa_visual_e_texto": "Análise técnica direta"}]'
    ],
    markdown=False,
)
