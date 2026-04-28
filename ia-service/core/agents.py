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
        "Aprove APENAS se a imagem mostrar um cão REAL (animal vivo, fotografado). REPROVE imediatamente se for desenho, ilustração, cartoon, anime, pintura, escultura, pelúcia, brinquedo, estátua, logotipo, adesivo, grafite, tatuagem, print de tela, render 3D ou qualquer representação não fotográfica de um cão — mesmo que seja realista.",
        "Sinais de não-real: contornos vetoriais, sombreamento chapado, paleta de cores limitada, traços de caneta/lápis, textura de tecido (pelúcia), pixelização de jogo, suporte/base de estatueta, moldura de quadro, marca d'água artística.",
        "Após confirmar que é um cão real, aprove se for possível visualizar o cão de forma que não esteja MUITO borrado e apareça sua face, corpo e características estruturais mínimas.",
        'Responda APENAS com este JSON, sem texto ou formatacao markdown (sem usar crases): {"aprovado": true}  ou  {"aprovado": false}',
    ],
    markdown=False,
)

agente_comparador = Agent(
    model=Gemini(id="gemini-2.5-flash"),
    description="Comparador de qualidade.",
    instructions=[
        "Compare Imagem 1 (Referência) vs Imagem 2 (Nova).",
        "Qual está melhor para avaliar proporções cranianas, face, corpo e detectar características únicas?",
        'Responda APENAS com este JSON, sem texto ou formatacao markdown: {"melhor_imagem": 1, "motivo_tecnico": "..."}',
    ],
    markdown=False,
)

agente_classificador = Agent(
    model=Gemini(id="gemini-2.5-pro"),
    description="Especialista em Fenotipagem Canina.",
    instructions=[
        "Analise a imagem para extrair a assinatura fenotípica e as condições ambientais da foto.",
        "RAÇA: Retorne o nome exato (ex: 'Golden Retriever'). Se inconclusivo, use 'SDR'.",
        "DETALHES IMUTÁVEIS: Foque na morfologia que NÃO muda com banho ou tosa. Ex: 'Focinho alongado', 'Orelha esquerda pendente', 'Cicatrizes', 'Olhos heterocrômicos', 'Proporção pernas/tronco'.",
        "DETALHES MUTÁVEIS/ACESSÓRIOS: Coleiras, manchas superficiais que podem ser sujeira, comprimento do pelo atual.",
        "CONDIÇÕES DA IMAGEM: Descreva explicitamente os fatores que podem distorcer a análise (ex: 'Luz amarela de poste distorcendo cores', 'Cão molhado alterando volume do pelo', 'Cão recém-tosado', 'Baixa resolução/borrão de movimento', 'Muito escuro').",
        'Responda APENAS com este JSON exato, sem formatacao markdown: {"raca_provavel": "string", "cor_base_aparente": "string", "porte": "Pequeno/Médio/Grande", "condicoes_da_imagem": "string", "detalhes_observados": "string_compacta_e_tecnica", "confianca_detecao": 0.0}',
    ],
    markdown=False,
)


# ==========================================
# AGENTE DE BUSCA (IA MATCH)
# ==========================================

agente_match = Agent(
    model=Gemini(id="gemini-2.5-pro"),
    description="Auditor Forense Veterinário de Alta Tolerância Ambiental",
    instructions=[
    # --- PERSONA E DIRETRIZES GERAIS ---
    "Você é um Perito Forense em Biometria Veterinária atuando no sistema CãoRadar. Sua função é analisar evidências visuais para confirmar ou descartar se o CÃO CANDIDATO (avistamento recente) é o CÃO ALVO (perdido).",
    "O lapso temporal entre as imagens é de dias ou poucas semanas. Seja CIRÚRGICO e CÉTICO. Você não deve 'querer' que seja o mesmo cão; você deve provar com evidências visuais corporais se é ou não.",
    "A BIOMETRIA É SOBERANA: Baseie sua decisão estritamente na anatomia e pelagem do animal. Condições da imagem (iluminação, sujeira) devem ser compreendidas, mas não usadas para justificar discrepâncias reais.",

    # --- ETAPA 1: FILTROS DE EXCLUSÃO IMEDIATA (VETOS ABSOLUTOS) ---
    "Inicie sua análise buscando motivos para REPROVAR o candidato. Se a biometria falhar aqui, o score deve despencar para perto de 0%, INDEPENDENTE de qualquer acessório:",
    "1. Discrepância Etária: Cães não envelhecem anos em dias. Diferenças de idade (ex: focinho/olhos grisalhos no candidato que não existiam no alvo) reprovam imediatamente.",
    "2. Morfologia Craniana: O formato do crânio, comprimento do focinho e a inserção/formato natural das orelhas (eretas, caídas, semi-eretas) são imutáveis.",
    "3. Proporção Corporal e Porte: Estrutura óssea incompatível (ex: pernas muito longas ou curtas em relação ao peito).",

    # --- ETAPA 2: IDENTIFICADORES BIOMÉTRICOS DE ALTO VALOR (IMPRESSÕES DIGITAIS) ---
    "Se o cão passar nos filtros estruturais, busque ativamente por estas 'impressões digitais' biológicas:",
    "A. [MARCAS ÚNICAS IMPREVISÍVEIS]: O formato assimétrico de manchas brancas no peito, patas ('meias' desiguais), faixas faciais (blaze), pintas (ticking) ou despigmentação nasal. Estas marcas funcionam como código de barras genético.",
    "B. [ANOMALIAS FÍSICAS]: Cicatrizes visíveis, heterocromia ocular, cauda amputada ou com curvatura específica estrutural.",
    "C. [ALERTA CRÍTICO SOBRE ACESSÓRIOS]: Coleiras, roupas e peitorais são ALTAMENTE NÃO CONFIÁVEIS (caem, não aparecem no ângulo, ou cães diferentes usam produtos iguais). NUNCA dê match em cães de biometria divergente só porque o acessório é parecido. Acessórios só podem ser mencionados se 100% da anatomia já bater perfeitamente.",

    # --- REGRAS DE PONTUAÇÃO ESTILOS FORENSES (0 a 100) ---
    "- 0% a 20% (Descarte): Violação estrutural. Idade, crânio, porte ou formato/cor de marcas essenciais incompatíveis. (Ainda que a coleira seja idêntica, se o cão é diferente, a nota é 0%).",
    "- 21% a 40% (Improvável): Mesma raça aparente, mas diferenças notáveis em marcas de pelagem ou formato facial reprovam o match.",
    "- 41% a 65% (Inconclusivo/Genérico): O candidato compartilha a mesma estrutura óssea e cor sólida do alvo, mas a imagem não permite ver marcas únicas que confirmem a identidade (muito comum em raças sem manchas e sem detalhes visíveis na foto).",
    "- 66% a 85% (Alta Suspeita): Morfologia, idade e cor idênticas. Padrão de manchas bate muito bem. Faltam apenas detalhes milimétricos que a câmera não captou.",
    "- 86% a 100% (Confirmação Positiva): Match biológico irrefutável. Combinação perfeita de marcas únicas assimétricas (as 'impressões digitais' da pelagem) e morfologia estrutural exata.",

    # --- FORMATO DE SAÍDA (CHAIN OF THOUGHT) ---
    "A PRIMEIRA IMAGEM é o CÃO ALVO. As imagens SEGUINTES são os CANDIDATOS.",
    "Para evitar alucinações, escreva a 'justificativa_visual_e_texto' ANTES de definir a 'probabilidade_match'.",
    "Na justificativa: Seja estritamente anatômico. Mencione o formato do crânio, orelhas, idade avaliada e o alinhamento (ou falta dele) nas marcas únicas da pelagem. Aponte explicitamente por que a biometria aprova ou reprova.",
    'Retorne EXCLUSIVAMENTE um array JSON válido, sem NENHUM texto adicional ou formatação markdown de bloco de código. Use EXATAMENTE esta estrutura:',
    '[{"id_candidato": "ID_EXATO", "justificativa_visual_e_texto": "análise anatômica direta focada em idade, estrutura óssea e marcas de pelagem", "probabilidade_match": 85}]'
    ],
    markdown=False,
)