import { describe, it, expect } from 'vitest';

import {
  CodeReviewOrchestrator
} from '../src/orchestrator.js';

import {
  ReviewReportSchema
} from '../src/types/index.js';


/**
 * Tests for CodeReviewOrchestrator
 *
 * These tests verify:
 * - orchestrator initialization
 * - custom configuration
 * - ReviewReport schema validation
 * - report structure
 * - required agent configuration
 *
 * Integration tests requiring real API credentials remain skipped.
 */

describe('CodeReviewOrchestrator', () => {
  describe('Configuration', () => {
    it('should initialize with default options', () => {
      const orchestrator = new CodeReviewOrchestrator();

      expect(orchestrator).toBeDefined();
      expect(orchestrator).toBeInstanceOf(CodeReviewOrchestrator);
    });

    it('should accept custom configuration', () => {
      const orchestrator = new CodeReviewOrchestrator({
        model: 'test-model',
        maxTurns: 10,
        timeoutMs: 30_000
      });

      expect(orchestrator).toBeDefined();
      expect(orchestrator).toBeInstanceOf(CodeReviewOrchestrator);
    });
  });


  describe('ReviewReport schema', () => {
    it('should validate a valid ReviewReport', () => {
      const mockReport = {
        pullRequest: {
          owner: 'octocat',
          repo: 'Hello-World',
          number: 1
        },

        fileReviews: [],

        summary: {
          totalFiles: 0,
          overallScore: 100,
          criticalIssues: 0,
          highPriorityTests: 0,
          refactoringOpportunities: 0
        },

        recommendations: [],

        metadata: {
          analyzedAt: new Date().toISOString(),
          duration: 100,
          agentVersions: {
            'code-quality-analyzer': '1.0.0',
            'test-coverage-analyzer': '1.0.0',
            'refactoring-suggester': '1.0.0'
          }
        }
      };

      const result = ReviewReportSchema.safeParse(mockReport);

      expect(result.success).toBe(true);
    });


    it('should reject an invalid ReviewReport', () => {
      const invalidReport = {
        pullRequest: {
          owner: 'octocat',
          repo: 'Hello-World'
        }
      };

      const result = ReviewReportSchema.safeParse(invalidReport);

      expect(result.success).toBe(false);
    });


    it('should validate report summary fields', () => {
      const mockReport = {
        pullRequest: {
          owner: 'test-owner',
          repo: 'test-repo',
          number: 1
        },

        fileReviews: [],

        summary: {
          totalFiles: 2,
          overallScore: 85,
          criticalIssues: 1,
          highPriorityTests: 2,
          refactoringOpportunities: 3
        },

        recommendations: [
          {
            priority: 'high' as const,
            category: 'security',
            description: 'Review security-sensitive code.',
            files: ['src/example.ts']
          }
        ],

        metadata: {
          analyzedAt: new Date().toISOString(),
          duration: 250,
          agentVersions: {
            'code-quality-analyzer': '1.0.0',
            'test-coverage-analyzer': '1.0.0',
            'refactoring-suggester': '1.0.0'
          }
        }
      };

      const result = ReviewReportSchema.safeParse(mockReport);

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.summary.totalFiles).toBe(2);
        expect(result.data.summary.overallScore).toBe(85);
        expect(result.data.summary.criticalIssues).toBe(1);
      }
    });


    it('should reject an invalid recommendation priority', () => {
      const invalidReport = {
        pullRequest: {
          owner: 'test-owner',
          repo: 'test-repo',
          number: 1
        },

        fileReviews: [],

        summary: {
          totalFiles: 0,
          overallScore: 100,
          criticalIssues: 0,
          highPriorityTests: 0,
          refactoringOpportunities: 0
        },

        recommendations: [
          {
            priority: 'urgent',
            category: 'security',
            description: 'Invalid priority.',
            files: []
          }
        ],

        metadata: {
          analyzedAt: new Date().toISOString(),
          duration: 100,
          agentVersions: {}
        }
      };

      const result = ReviewReportSchema.safeParse(invalidReport);

      expect(result.success).toBe(false);
    });
  });


  describe('Integration', () => {
    /**
     * This test requires:
     * - GITHUB_TOKEN
     * - ANTHROPIC_API_KEY or AWS credentials
     *
     * It is intentionally skipped during normal test runs.
     *
     * Run a real integration test manually only when valid
     * credentials are available.
     */
    it.skip('should review a real small PR', async () => {
      const orchestrator = new CodeReviewOrchestrator();

      const report = await orchestrator.reviewPullRequest(
        'octocat',
        'Hello-World',
        1
      );

      expect(report).toBeDefined();
      expect(report.pullRequest.owner).toBe('octocat');
      expect(report.pullRequest.repo).toBe('Hello-World');
      expect(report.pullRequest.number).toBe(1);

      expect(report.summary).toBeDefined();
      expect(report.fileReviews).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.metadata).toBeDefined();
    });
  });
});