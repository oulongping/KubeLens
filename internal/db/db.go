package db

import (
	"context"
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

type Store struct {
	DB *sql.DB
}

func New(pgURL string) (*Store, error) {
	db, err := sql.Open("postgres", pgURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open db: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping db: %w", err)
	}
	return &Store{DB: db}, nil
}

func (s *Store) Close() error { return s.DB.Close() }

// Example table to store cluster snapshots or favorites
func (s *Store) EnsureSchema(ctx context.Context) error {
	_, err := s.DB.ExecContext(ctx, `
CREATE TABLE IF NOT EXISTS cluster_events (
	id SERIAL PRIMARY KEY,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	kind TEXT NOT NULL,
	name TEXT NOT NULL,
	namespace TEXT,
	level TEXT,
	message TEXT
);
`)
	return err
}
