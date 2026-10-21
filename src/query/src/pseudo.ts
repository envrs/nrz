import { error } from '@nrz/error-cause'
import { removeDanglingEdges, removeNode } from './pseudo/helpers.js'
import { didYouMean, queryError, selectorText } from './error.js'
import {
  asPostcssNodeWithChildren,
  asPseudoNode,
  isSelectorNode,
} from '@nrz/dss-parser'

// imported pseudo selectors
import { abandoned } from './pseudo/abandoned.js'
import { attr } from './pseudo/attr.js'
import { built } from './pseudo/built.js'
import { confused } from './pseudo/confused.js'
import { cve } from './pseudo/cve.js'
import { cwe } from './pseudo/cwe.js'
import { debug } from './pseudo/debug.js'
import { deprecated } from './pseudo/deprecated.js'
import { dev } from './pseudo/dev.js'
import { diff } from './pseudo/diff.js'
import { dist } from './pseudo/dist.js'
import { dynamic } from './pseudo/dynamic.js'
import { empty } from './pseudo/empty.js'
import { entropic } from './pseudo/entropic.js'
import { env } from './pseudo/env.js'
import { evalParser } from './pseudo/eval.js'
import { fs } from './pseudo/fs.js'
import { hostContext } from './pseudo/host.js'
import { hostname } from './pseudo/hostname.js'
import { license } from './pseudo/license.js'
import { link } from './pseudo/link.js'
import { malware } from './pseudo/malware.js'
import { minified } from './pseudo/minified.js'
import { missing } from './pseudo/missing.js'
import { nativeParser } from './pseudo/native.js'
import { network } from './pseudo/network.js'
import { obfuscated } from './pseudo/obfuscated.js'
import { optional } from './pseudo/optional.js'
import { outdated } from './pseudo/outdated.js'
import { overridden } from './pseudo/overridden.js'
import { path } from './pseudo/path.js'
import { peer } from './pseudo/peer.js'
import { prerelease } from './pseudo/prerelease.js'
import { published } from './pseudo/published.js'
import { privateParser } from './pseudo/private.js'
import { registry } from './pseudo/registry.js'
import { prod } from './pseudo/prod.js'
import { root } from './pseudo/root.js'
import { scanned } from './pseudo/scanned.js'
import { score } from './pseudo/score.js'
import { scripts } from './pseudo/scripts.js'
import { shell } from './pseudo/shell.js'
import { semverParser as semver } from './pseudo/semver.js'
import { severity } from './pseudo/severity.js'
import { spec } from './pseudo/spec.js'
import { shrinkwrap } from './pseudo/shrinkwrap.js'
import { skill } from './pseudo/skill.js'
import { skills } from './pseudo/skills.js'
import { squat } from './pseudo/squat.js'
import { suspicious } from './pseudo/suspicious.js'
import { tracker } from './pseudo/tracker.js'
import { trivial } from './pseudo/trivial.js'
import { type } from './pseudo/type.js'
import { undesirable } from './pseudo/undesirable.js'
import { unknown } from './pseudo/unknown.js'
import { unmaintained } from './pseudo/unmaintained.js'
import { unpopular } from './pseudo/unpopular.js'
import { unstable } from './pseudo/unstable.js'
import { vuln } from './pseudo/vuln.js'
import { workspace } from './pseudo/workspace.js'

import type { PseudoClassName } from '@nrz/dss-parser'
import type { EdgeLike, NodeLike } from '@nrz/types'
import type { ParserFn, ParserState } from './types.js'

/**
 * :has Pseudo-Selector, matches only nodes that have valid results
 * for its nested selector expressions.
 */
const has = async (state: ParserState) => {
  const top = asPostcssNodeWithChildren(state.current)
  const collectNodes = new Set<NodeLike>()
  const collectEdges = new Set<EdgeLike>()

  for (const node of top.nodes) {
    if (isSelectorNode(node)) {
      const nestedState = await state.walk({
        cancellable: state.cancellable,
        initial: {
          edges: new Set(state.initial.edges),
          nodes: new Set(state.initial.nodes),
        },
        current: node,
        walk: state.walk,
        collect: {
          edges: new Set(),
          nodes: new Set(),
        },
        partial: {
          edges: new Set(state.partial.edges),
          nodes: new Set(state.partial.nodes),
        },
        diffFiles: state.diffFiles,
        hasSkills: state.hasSkills,
        loose: state.loose,
        hostContexts: state.hostContexts,
        importers: state.importers,
        retries: state.retries,
        securityArchive: state.securityArchive,
        signal: state.signal,
        scopeIDs: state.scopeIDs,
        comment: state.comment,
        specificity: { ...state.specificity },
      })
      for (const n of nestedState.collect.nodes) {
        collectNodes.add(n)
      }
      for (const e of nestedState.partial.edges) {
        collectEdges.add(e)
      }
    }
  }

  // if the nested selector did not match anything, that means
  // no current node has any matches
  if (collectNodes.size === 0) {
    state.partial.edges.clear()
    state.partial.nodes.clear()
    return state
  }

  // handles transitive dependencies
  // compareNodes collects a list of all ancestor nodes
  // from the resulting nodes of the nested selector
  const compareNodes = new Set<NodeLike>()
  const traverse = new Set(collectNodes)
  for (const node of traverse) {
    for (const edge of node.edgesIn) {
      compareNodes.add(edge.from)
      if (edge.from.edgesIn.size) {
        traverse.add(edge.from)
      }
    }
  }

  // for each node in the current list checks to see if
  // it has a node in the resulting nested state that is
  // a transitive dependency / children.
  nodesLoop: for (const node of state.partial.nodes) {
    if (node.edgesOut.size === 0 || !compareNodes.has(node)) {
      removeNode(state, node)
      continue
    }

    for (const edge of node.edgesOut.values()) {
      if (collectEdges.has(edge)) {
        continue nodesLoop
      }
    }
    removeNode(state, node)
  }

  removeDanglingEdges(state)

  return state
}

/**
 * :is Pseudo-selector, acts as a shortcut for writing more compact expressions
 * by allowing multiple nested selectors to match on the previous results.
 *
 * It also enables the loose parsing mode, skipping instead of erroring usage
 * of non-existing classes, identifiers, pseudo-classes, etc.
 */
const is = async (state: ParserState) => {
  const top = asPostcssNodeWithChildren(state.current)
  const collect = new Set()
  for (const node of top.nodes) {
    if (isSelectorNode(node)) {
      const nestedState = await state.walk({
        cancellable: state.cancellable,
        collect: {
          edges: new Set(),
          nodes: new Set(),
        },
        current: node,
        diffFiles: state.diffFiles,
        hasSkills: state.hasSkills,
        initial: state.initial,
        loose: true,
        partial: {
          nodes: new Set(state.partial.nodes),
          edges: new Set(state.partial.edges),
        },
        importers: state.importers,
        hostContexts: state.hostContexts,
        walk: state.walk,
        retries: state.retries,
        securityArchive: state.securityArchive,
        signal: state.signal,
        scopeIDs: state.scopeIDs,
        comment: state.comment,
        specificity: { ...state.specificity },
      })
      for (const n of nestedState.collect.nodes) {
        collect.add(n)
      }
    }
  }
  for (const node of state.partial.nodes) {
    if (!collect.has(node)) {
      removeNode(state, node)
    }
  }
  return state
}

/**
 * :not Pseudo-class, serves to create negate expressions, anything that
 * matches selectors declared inside the `:not()` expression is going to be
 * filtered out in the final result.
 */
const not = async (state: ParserState) => {
  const top = asPostcssNodeWithChildren(state.current)
  const collect = new Set()
  for (const node of top.nodes) {
    if (isSelectorNode(node)) {
      const nestedState = await state.walk({
        cancellable: state.cancellable,
        collect: {
          edges: new Set(),
          nodes: new Set(),
        },
        current: node,
        diffFiles: state.diffFiles,
        hasSkills: state.hasSkills,
        initial: state.initial,
        loose: state.loose,
        partial: {
          nodes: new Set(state.partial.nodes),
          edges: new Set(state.partial.edges),
        },
        importers: state.importers,
        hostContexts: state.hostContexts,
        walk: state.walk,
        retries: state.retries,
        securityArchive: state.securityArchive,
        signal: state.signal,
        scopeIDs: state.scopeIDs,
        comment: state.comment,
        specificity: { ...state.specificity },
      })
      for (const n of nestedState.collect.nodes) {
        collect.add(n)
      }
      /* c8 ignore start - should be impossible */
    } else {
      throw error('Error parsing :not() selectors', {
        wanted: { type: 'selector' },
        found: node,
      })
    }
    /* c8 ignore stop */
  }
  for (const node of state.partial.nodes) {
    if (collect.has(node)) {
      removeNode(state, node)
    }
  }

  removeDanglingEdges(state)

  return state
}

/**
 * :project Pseudo-Class, matches only graph importers (e.g: the
 * root node along with any configured workspace)
 */
const project = async (state: ParserState) => {
  for (const node of state.partial.nodes) {
    if (!node.importer) {
      removeNode(state, node)
    }
  }
  for (const edge of state.partial.edges) {
    if (!edge.to?.importer) {
      state.partial.edges.delete(edge)
    }
  }
  return state
}

/**
 * :scope Pseudo-Element, returns only the nodes that match the provided scopeIDs
 * from the Query.search method.
 */
const scope = async (state: ParserState) => {
  const scopeIDSet = new Set(state.scopeIDs)

  for (const node of state.partial.nodes) {
    if (!scopeIDSet.has(node.id)) {
      removeNode(state, node)
    }
  }

  removeDanglingEdges(state)

  return state
}

const pseudoSelectors = new Map<string, ParserFn>(
  Object.entries({
    abandoned,
    attr,
    built,
    confused,
    cve,
    cwe,
    debug,
    deprecated,
    dev,
    diff,
    dist,
    dynamic,
    eval: evalParser,
    empty,
    entropic,
    env,
    fs,
    has,
    host: hostContext,
    hostname,
    is,
    license,
    link,
    malware,
    minified,
    missing,
    native: nativeParser,
    network,
    not,
    obfuscated,
    optional,
    outdated,
    overridden,
    path,
    peer,
    prerelease,
    published,
    private: privateParser,
    prod,
    registry,
    project,
    root,
    scanned,
    scope,
    score,
    scripts,
    semver,
    sev: severity,
    spec,
    severity,
    shell,
    shrinkwrap,
    skill,
    skills,
    squat,
    suspicious,
    tracker,
    trivial,
    type,
    undesirable,
    unknown,
    unmaintained,
    unpopular,
    unstable,
    v: semver,
    vuln,
    vulnerable: vuln,
    workspace,
  } satisfies Record<PseudoClassName, ParserFn>),
)

/**
 * Names of every supported pseudo-class, without the leading `:`.
 */
export const pseudoSelectorNames: ReadonlySet<string> = new Set(
  pseudoSelectors.keys(),
)

/**
 * Parsers the `pseudo` node types.
 */
export const pseudo = async (state: ParserState) => {
  await state.cancellable()

  const curr = asPseudoNode(state.current)
  const parserFn =
    curr.value && pseudoSelectors.get(curr.value.slice(1))

  if (!parserFn) {
    if (state.loose) {
      state.partial.edges.clear()
      state.partial.nodes.clear()
      return state
    }

    // `:difff(x)` should still suggest `:diff`, so drop any arguments
    const name = selectorText(state.current)
      .replace(/^:/, '')
      .replace(/\(.*$/s, '')
    const suggestions = didYouMean(name, pseudoSelectorNames).map(
      n => `:${n}`,
    )
    throw queryError(
      `Unsupported pseudo-class: ${state.current.value}`,
      state.current,
      suggestions.length > 1 ?
        { validOptions: suggestions }
      : { wanted: suggestions[0] },
    )
  }

  const result = await parserFn(state)

  // Increment the commonCounter for specificity, except for
  // nesting selectors which don't contribute to specificity
  const pseudoValue = curr.value.slice(1)
  if (
    pseudoValue &&
    pseudoValue !== 'not' &&
    pseudoValue !== 'is' &&
    pseudoValue !== 'has'
  ) {
    result.specificity.commonCounter += 1
  }

  return result
}
