import t from 'tap'
import { joinDepIDTuple } from '@nrz/dep-id'
import { asSecurityArchiveLike } from '@nrz/security-archive'
import { SecurityArchive } from '@nrz/security-archive/browser'
import type { PackageReportData } from '@nrz/security-archive'
import { scanned } from '../../src/pseudo/scanned.js'
import { getSimpleGraph } from '../fixtures/graph.js'
import type { ParserState } from '../../src/types.js'
import { parse } from '../../src/parser.js'

t.test('scanned selector', async t => {
  const getState = () => {
    const graph = getSimpleGraph()
    const ast = parse(':scanned')
    const current = ast.first.first
    const testId = joinDepIDTuple(['registry', '', 'e@1.0.0'])
    const securityArchive = asSecurityArchiveLike(
      new Map<string, PackageReportData>([
        [
          testId,
          {
            id: 'e@1.0.0',
            author: [],
            size: 0,
            type: 'npm',
            name: 'e',
            version: '1.0.0',
            license: 'MIT',
            score: {
              overall: 0,
              license: 0,
              maintenance: 0,
              quality: 0,
              supplyChain: 0,
              vulnerability: 0,
            },
            alerts: [],
          },
        ],
      ]),
    )
    const state: ParserState = {
      comment: '',
      current,
      initial: {
        edges: new Set(graph.edges.values()),
        nodes: new Set(graph.nodes.values()),
      },
      partial: {
        edges: new Set(graph.edges.values()),
        nodes: new Set(graph.nodes.values()),
      },
      collect: {
        edges: new Set(),
        nodes: new Set(),
      },
      cancellable: async () => {},
      walk: async i => i,
      securityArchive,
      importers: new Set(graph.importers),
      retries: 0,
      signal: new AbortController().signal,
      specificity: { idCounter: 0, commonCounter: 0 },
    }
    return state
  }

  const state = getState()
  const result = await scanned(state)
  t.matchSnapshot(
    {
      nodes: [...result.partial.nodes].map(n => n.id),
      edges: [...result.partial.edges].map(
        e => `${e.from.id}->${e.to?.id}`,
      ),
    },
    'should return only nodes with security archive data available',
  )

  await t.test('matches peer-suffixed node ids', async t => {
    const graph = getSimpleGraph()
    const e = [...graph.nodes.values()].find(n => n.name === 'e')
    if (!e) throw new Error('expected node e')
    const baseId = e.id
    const peerId = joinDepIDTuple([
      'registry',
      '',
      'e@1.0.0',
      'peer.0123456789abcdef',
    ])
    graph.nodes.delete(baseId)
    e.id = peerId
    graph.nodes.set(peerId, e)
    const ast = parse(':scanned')
    const archive = SecurityArchive.load({
      [baseId]: {
        id: 'e@1.0.0',
        author: [],
        size: 0,
        type: 'npm',
        name: 'e',
        version: '1.0.0',
        license: 'MIT',
        score: {
          overall: 0,
          license: 0,
          maintenance: 0,
          quality: 0,
          supplyChain: 0,
          vulnerability: 0,
        },
        alerts: [],
      },
    })
    const state: ParserState = {
      comment: '',
      current: ast.first.first,
      initial: {
        edges: new Set(graph.edges.values()),
        nodes: new Set(graph.nodes.values()),
      },
      partial: {
        edges: new Set(graph.edges.values()),
        nodes: new Set(graph.nodes.values()),
      },
      collect: {
        edges: new Set(),
        nodes: new Set(),
      },
      cancellable: async () => {},
      walk: async i => i,
      securityArchive: archive,
      importers: new Set(graph.importers),
      retries: 0,
      signal: new AbortController().signal,
      specificity: { idCounter: 0, commonCounter: 0 },
    }
    const res = await scanned(state)
    t.ok(
      [...res.partial.nodes].some(n => n.id === peerId),
      ':scanned keeps a node whose DepID extra is a peer hash',
    )
  })
})
