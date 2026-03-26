import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Cao, CaoCadastro, RacaCao, StatusCao } from '../models/cao.model';
import { AuthService } from './auth.service';

/**
 * Serviço de gerenciamento de cães
 * Gerencia CRUD de cães perdidos e encontrados
 */
@Injectable({
  providedIn: 'root'
})
export class CaoService {
  // Lista de cães mockados (simulando banco de dados)
  private caes: Cao[] = [
    {
      id: '1',
      nome: 'Rex',
      raca: 'Golden Retriever',
      idade: 3,
      sexo: 'Macho',
      cor: 'Dourado',
      descricao: 'Cachorro grande, muito amigável, responde pelo nome Rex',
      foto: 'assets/images/golden-retriever.jpg',
      status: 'Perdido',
      dataPerdido: new Date('2026-01-20'),
      localizacaoPerdido: {
        endereco: 'Rua das Flores, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        bairro: 'Vila Mariana'
      },
      usuarioId: '1',
      contatoResponsavel: {
        nome: 'Usuário Teste',
        telefone: '(11) 98765-4321',
        email: 'usuario@teste.com'
      },
      observacoes: 'Estava usando coleira azul',
      recompensa: 500
    },
    {
      id: '2',
      nome: 'Mel',
      raca: 'Poodle',
      idade: 2,
      sexo: 'Fêmea',
      cor: 'Branco',
      descricao: 'Poodle toy, muito pequena e dócil',
      foto: 'assets/images/poodle.jpg',
      status: 'Encontrado',
      dataPerdido: new Date('2026-01-15'),
      dataEncontrado: new Date('2026-01-28'),
      localizacaoPerdido: {
        endereco: 'Av. Paulista, 1000',
        cidade: 'São Paulo',
        estado: 'SP',
        bairro: 'Bela Vista'
      },
      localizacaoEncontrado: {
        endereco: 'Rua Augusta, 500',
        cidade: 'São Paulo',
        estado: 'SP',
        bairro: 'Consolação'
      },
      usuarioId: '3',
      contatoResponsavel: {
        nome: 'Maria Silva',
        telefone: '(11) 99876-5432',
        email: 'maria@email.com'
      },
      observacoes: 'Encontrada por câmera de segurança próxima ao metrô'
    },
    {
      id: '3',
      nome: 'Thor',
      raca: 'Pastor Alemão',
      idade: 5,
      sexo: 'Macho',
      cor: 'Preto e marrom',
      descricao: 'Pastor alemão adulto, muito protetor',
      foto: 'assets/images/pastor-alemao.jpg',
      status: 'Perdido',
      dataPerdido: new Date('2026-01-25'),
      localizacaoPerdido: {
        endereco: 'Parque Ibirapuera',
        cidade: 'São Paulo',
        estado: 'SP',
        bairro: 'Moema'
      },
      usuarioId: '1',
      contatoResponsavel: {
        nome: 'Usuário Teste',
        telefone: '(11) 98765-4321',
        email: 'usuario@teste.com'
      },
      recompensa: 1000
    },
    {
      id: '4',
      nome: 'Princesa',
      raca: 'Yorkshire Terrier',
      idade: 1,
      sexo: 'Fêmea',
      cor: 'Marrom e preto',
      descricao: 'Yorkshire muito pequena, usa lacinho rosa',
      foto: 'assets/images/yorkshire.jpg',
      status: 'Perdido',
      dataPerdido: new Date('2026-01-27'),
      localizacaoPerdido: {
        endereco: 'Shopping Eldorado',
        cidade: 'São Paulo',
        estado: 'SP',
        bairro: 'Pinheiros'
      },
      usuarioId: '3',
      contatoResponsavel: {
        nome: 'Maria Silva',
        telefone: '(11) 99876-5432',
        email: 'maria@email.com'
      },
      observacoes: 'Muito assustada com estranhos'
    },
    {
      id: '5',
      nome: 'Duke',
      raca: 'Bulldog Francês',
      idade: 4,
      sexo: 'Macho',
      cor: 'Tigrado',
      descricao: 'Bulldog francês com manchas tigradas',
      foto: 'assets/images/bulldog-frances.jpg',
      status: 'Encontrado',
      dataPerdido: new Date('2026-01-18'),
      dataEncontrado: new Date('2026-01-26'),
      localizacaoPerdido: {
        endereco: 'Rua Oscar Freire, 200',
        cidade: 'São Paulo',
        estado: 'SP',
        bairro: 'Jardins'
      },
      localizacaoEncontrado: {
        endereco: 'Rua Haddock Lobo, 150',
        cidade: 'São Paulo',
        estado: 'SP',
        bairro: 'Cerqueira César'
      },
      usuarioId: '1',
      contatoResponsavel: {
        nome: 'Usuário Teste',
        telefone: '(11) 98765-4321',
        email: 'usuario@teste.com'
      },
      observacoes: 'Identificado por sistema de câmeras com IA'
    }
  ];

  constructor(private authService: AuthService) {}

  /**
   * Retorna todos os cães
   */
  getAllCaes(): Observable<Cao[]> {
    return of([...this.caes]).pipe(delay(500));
  }

  /**
   * Retorna cães por status
   */
  getCaesByStatus(status: StatusCao): Observable<Cao[]> {
    return of(this.caes.filter(cao => cao.status === status)).pipe(delay(500));
  }

  /**
   * Retorna cães perdidos
   */
  getCaesPerdidos(): Observable<Cao[]> {
    return this.getCaesByStatus('Perdido');
  }

  /**
   * Retorna cães encontrados
   */
  getCaesEncontrados(): Observable<Cao[]> {
    return this.getCaesByStatus('Encontrado');
  }

  /**
   * Retorna cães do usuário logado
   */
  getMeusCaes(): Observable<Cao[]> {
    const userId = this.authService.currentUserValue?.id;
    
    if (!userId) {
      return throwError(() => new Error('Usuário não autenticado'));
    }

    return of(this.caes.filter(cao => cao.usuarioId === userId)).pipe(delay(500));
  }

  /**
   * Retorna cães filtrados por raça
   */
  getCaesByRaca(raca: RacaCao): Observable<Cao[]> {
    return of(this.caes.filter(cao => cao.raca === raca)).pipe(delay(500));
  }

  /**
   * Retorna um cão específico por ID
   */
  getCaoById(id: string): Observable<Cao | undefined> {
    return of(this.caes.find(cao => cao.id === id)).pipe(delay(300));
  }

  /**
   * Cadastra um novo cão perdido
   */
  cadastrarCao(caoCadastro: CaoCadastro): Observable<Cao> {
    const userId = this.authService.currentUserValue?.id;
    
    if (!userId) {
      return throwError(() => new Error('Usuário não autenticado'));
    }

    return of(null).pipe(
      delay(1000),
      map(() => {
        const novoCao: Cao = {
          id: (this.caes.length + 1).toString(),
          ...caoCadastro,
          status: 'Perdido',
          localizacaoPerdido: caoCadastro.localizacao,
          usuarioId: userId
        };

        this.caes.push(novoCao);
        return novoCao;
      })
    );
  }

  /**
   * Atualiza um cão existente
   */
  updateCao(id: string, caoData: Partial<Cao>): Observable<Cao> {
    return of(null).pipe(
      delay(800),
      map(() => {
        const caoIndex = this.caes.findIndex(cao => cao.id === id);
        
        if (caoIndex === -1) {
          throw new Error('Cão não encontrado');
        }

        // Verifica se o usuário tem permissão
        const userId = this.authService.currentUserValue?.id;
        const isAdmin = this.authService.isAdmin();
        
        if (!isAdmin && this.caes[caoIndex].usuarioId !== userId) {
          throw new Error('Você não tem permissão para editar este cadastro');
        }

        this.caes[caoIndex] = {
          ...this.caes[caoIndex],
          ...caoData
        };

        return this.caes[caoIndex];
      })
    );
  }

  /**
   * Marca um cão como encontrado
   */
  marcarComoEncontrado(
    id: string, 
    localizacaoEncontrado: Cao['localizacaoEncontrado'],
    observacoes?: string
  ): Observable<Cao> {
    return this.updateCao(id, {
      status: 'Encontrado',
      dataEncontrado: new Date(),
      localizacaoEncontrado,
      observacoes
    });
  }

  /**
   * Deleta um cão
   */
  deleteCao(id: string): Observable<boolean> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const caoIndex = this.caes.findIndex(cao => cao.id === id);
        
        if (caoIndex === -1) {
          throw new Error('Cão não encontrado');
        }

        // Verifica se o usuário tem permissão
        const userId = this.authService.currentUserValue?.id;
        const isAdmin = this.authService.isAdmin();
        
        if (!isAdmin && this.caes[caoIndex].usuarioId !== userId) {
          throw new Error('Você não tem permissão para deletar este cadastro');
        }

        this.caes.splice(caoIndex, 1);
        return true;
      })
    );
  }

  /**
   * Busca cães por termo (nome, raça, localização)
   */
  buscarCaes(termo: string): Observable<Cao[]> {
    const termoLower = termo.toLowerCase();
    
    return of(
      this.caes.filter(cao => 
        cao.nome.toLowerCase().includes(termoLower) ||
        cao.raca.toLowerCase().includes(termoLower) ||
        cao.localizacaoPerdido.cidade.toLowerCase().includes(termoLower) ||
        cao.localizacaoPerdido.bairro?.toLowerCase().includes(termoLower)
      )
    ).pipe(delay(500));
  }

  /**
   * Retorna estatísticas (para dashboard admin)
   */
  getEstatisticas(): Observable<{
    totalCaes: number;
    caesPerdidos: number;
    caesEncontrados: number;
    taxaEncontro: number;
  }> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const totalCaes = this.caes.length;
        const caesPerdidos = this.caes.filter(c => c.status === 'Perdido').length;
        const caesEncontrados = this.caes.filter(c => c.status === 'Encontrado').length;
        const taxaEncontro = totalCaes > 0 ? (caesEncontrados / totalCaes) * 100 : 0;

        return {
          totalCaes,
          caesPerdidos,
          caesEncontrados,
          taxaEncontro: Math.round(taxaEncontro)
        };
      })
    );
  }
}
