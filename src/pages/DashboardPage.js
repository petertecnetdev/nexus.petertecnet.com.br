import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../components/NavlogComponent";
import { apiBaseUrl, storageUrl } from "../config";
import "./dashboard.css";

export default function DashboardPage() {
  const [establishments, setEstablishments] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          `${apiBaseUrl}/establishment/my/category/barbershop`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let ests = [];
        if (Array.isArray(data)) {
          ests = data;
        } else if (Array.isArray(data.establishments)) {
          ests = data.establishments;
        } else if (
          data.establishments &&
          Array.isArray(data.establishments.data)
        ) {
          ests = data.establishments.data;
        } else if (Array.isArray(data.data)) {
          ests = data.data;
        }

        setEstablishments(ests);

        const today = new Date().toLocaleDateString("en-CA", {
          timeZone: "America/Sao_Paulo",
        });

        const results = await Promise.all(
          ests.map(async (est) => {
            let rawOrders = [];
            try {
              const res = await axios.get(`${apiBaseUrl}/order/listbyentity`, {
                params: {
                  app_id: 2,
                  entity_name: "establishment",
                  entity_id: est.id,
                },
                headers: { Authorization: `Bearer ${token}` },
              });

              rawOrders = Array.isArray(res.data.orders) ? res.data.orders : [];
            } catch (err) {
              if (err.response?.status === 404) {
                rawOrders = [];
              } else {
                throw err;
              }
            }

            const orders = rawOrders.filter((o) => {
              const date = new Date(o.order_datetime).toLocaleDateString(
                "en-CA",
                {
                  timeZone: "America/Sao_Paulo",
                }
              );
              return date === today;
            });

            const totalOrders = orders.length;
            const totalValue = orders.reduce((sum, o) => {
              const orderSum = (o.items || []).reduce((s, it) => {
                let sub = Number(it.subtotal || 0);
                (it.modifiers || [])
                  .filter((m) => m.type === "addition")
                  .forEach((m) => {
                    const prod = (it.modifiers || []).find(
                      (p) => p.id === m.modifier_id
                    );
                    sub += (prod ? Number(prod.price) : 0) * (m.quantity || 1);
                  });
                return s + sub;
              }, 0);
              return sum + orderSum;
            }, 0);

            const itemCounts = {};
            orders.forEach((o) =>
              (o.items || []).forEach((it) => {
                const name = it.item?.name || "-";
                itemCounts[name] = (itemCounts[name] || 0) + (it.quantity || 0);
              })
            );
            const mostOrderedItem =
              Object.entries(itemCounts).reduce(
                (max, [name, qty]) => (qty > max[1] ? [name, qty] : max),
                ["-", 0]
              )[0] || "-";

            const customerSums = {};
            orders.forEach((o) => {
              const sum = (o.items || []).reduce((s, it) => {
                let sub = Number(it.subtotal || 0);
                (it.modifiers || [])
                  .filter((m) => m.type === "addition")
                  .forEach((m) => {
                    const prod = (it.modifiers || []).find(
                      (p) => p.id === m.modifier_id
                    );
                    sub += (prod ? Number(prod.price) : 0) * (m.quantity || 1);
                  });
                return s + sub;
              }, 0);
              const cname = o.customer_name || "-";
              customerSums[cname] = (customerSums[cname] || 0) + sum;
            });
            const topCustomer =
              Object.entries(customerSums).reduce(
                (max, [name, sum]) => (sum > max[1] ? [name, sum] : max),
                ["-", 0]
              )[0] || "-";

            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const now = new Date();
            const hoursElapsed = Math.max((now - start) / 36e5, 1);
            const avgOrdersPerHour = (totalOrders / hoursElapsed).toFixed(2);
            const avgTicket = totalOrders
              ? (totalValue / totalOrders).toFixed(2)
              : "0.00";

            return [
              est.id,
              {
                totalOrders,
                totalValue: totalValue.toFixed(2),
                mostOrderedItem,
                topCustomer,
                avgOrdersPerHour,
                avgTicket,
              },
            ];
          })
        );

        setMetrics(Object.fromEntries(results));
      } catch (err) {
        const status = err.response?.status;
        Swal.fire({
          icon: "error",
          title: "Erro",
          text:
            status === 401
              ? "Sessão expirada. Faça login novamente."
              : "Não foi possível carregar dados.",
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleLogoError = (e) => {
    e.target.onerror = null;
    e.target.src = "/images/logo.png";
  };

  if (isLoading) {
    return <Container className="text-center mt-5"></Container>;
  }

  return (
    <div className="dashboard-root">
      <NavlogComponent />
      <Container fluid className="dashboard-main">
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">Meus Estabelecimentos</h3>
          <Row className="dashboard-establishments-list gx-3 gy-4">
            {establishments.length === 0 && (
              <Col md={12}>
                <Card className="dashboard-empty-card">
                  <Card.Body className="text-center">
                    <div className="dashboard-empty mb-3">
                      Nenhum estabelecimento encontrado.
                    </div>
                    <Button
                      as={Link}
                      to="/establishment/create"
                      size="sm"
                      className="dashboard-establishment-btn bg-black"
                    >
                      Criar meu estabelecimento
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            )}
            {establishments.map((est) => {
              const m = metrics[est.id] || {};
              return (
                <Col key={est.id} md={12}>
                  <Card className="dashboard-establishment-card h-100">
                    <Card.Body>
                      <div className="dashboard-establishment-header mb-3">
                        <img
                          src={`${storageUrl}/${est.logo || "logo.png"}`}
                          alt={est.name}
                          className="dashboard-establishment-logo"
                          onError={handleLogoError}
                        />
                        <div>
                          <div className="dashboard-establishment-name">
                            {est.name}
                          </div>
                          <div className="dashboard-establishment-slug">
                            @{est.slug}
                          </div>
                          <Button
                            as={Link}
                            to={`/establishment/view/${est.slug}`}
                            size="sm"
                            className="dashboard-establishment-btn mx-1 bg-black"
                          >
                            Página
                          </Button>
                        </div>
                      </div>
                      <Card bg="dark" text="light" className="m-2">
                        <Card.Body className="p-2">
                          <Row className="gx-2 gy-2 text-center">
                            <Col md={3}>
                              <Button
                                as={Link}
                                to={`/order/create/${est.id}`}
                                size="sm"
                                className="dashboard-establishment-btn bg-black w-100"
                              >
                                Novo atendimento
                              </Button>
                            </Col>
                            <Col md={3}>
                              <Button
                                as={Link}
                                to={`/order/list/${est.id}`}
                                size="sm"
                                className="dashboard-establishment-btn bg-black w-100"
                              >
                                📑 Atendimentos
                              </Button>
                            </Col>
                            <Col md={3}>
                              <Button
                                as={Link}
                                to={`/employer/list/${est.id}`}
                                size="sm"
                                className="dashboard-establishment-btn bg-black w-100"
                              >
                                👥 Colaboradores
                              </Button>
                            </Col>
                            <Col md={3}>
                              <Button
                                as={Link}
                                to={`/report/order/${est.id}`}
                                size="sm"
                                className="dashboard-establishment-btn bg-black w-100"
                              >
                                📊 Relatório
                              </Button>
                            </Col>
                            <Col md={3}>
                              <Button
                                as={Link}
                                to={`/item/list/${est.slug}`}
                                size="sm"
                                className="dashboard-establishment-btn bg-black w-100"
                              >
                                Itens
                              </Button>
                            </Col>
                            <Col md={2}>
                              <Button
                                as={Link}
                                to={`/establishment/update/${est.id}`}
                                size="sm"
                                className="dashboard-establishment-btn bg-black w-100"
                              >
                                ✏️ Editar
                              </Button>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                      <Card bg="dark" text="light" className="mb-2">
                        <Card.Header className="bg-dark text-light">
                          <strong>Retrato de hoje</strong>
                        </Card.Header>
                        <Card.Body className="p-2">
                          <Row className="mb-3 text-center">
                            <Col md={2}>
                              <Card bg="black" text="light" className="mb-2">
                                <Card.Body className="p-2">
                                  <Card.Title className="fs-6">
                                    Atendimentos
                                  </Card.Title>
                                  <Card.Text className="fs-5 fw-bold">
                                    {m.totalOrders || 0}
                                  </Card.Text>
                                </Card.Body>
                              </Card>
                            </Col>
                            <Col md={2}>
                              <Card bg="black" text="light" className="mb-2">
                                <Card.Body className="p-2">
                                  <Card.Title className="fs-6">
                                    Faturamento
                                  </Card.Title>
                                  <Card.Text className="fs-5 fw-bold">
                                    R{String.fromCharCode(36)}
                                    {(m.totalValue || "0.00").replace(".", ",")}
                                  </Card.Text>
                                </Card.Body>
                              </Card>
                            </Col>
                            <Col md={3}>
                              <Card bg="black" text="light" className="mb-2">
                                <Card.Body className="p-2">
                                  <Card.Title className="fs-6">
                                    Mais pedido
                                  </Card.Title>
                                  <Card.Text className="fs-6 fw-bold">
                                    {m.mostOrderedItem}
                                  </Card.Text>
                                </Card.Body>
                              </Card>
                            </Col>
                            <Col md={3}>
                              <Card bg="black" text="light" className="mb-2">
                                <Card.Body className="p-2">
                                  <Card.Title className="fs-6">
                                    Cliente top
                                  </Card.Title>
                                  <Card.Text className="fs-6 fw-bold">
                                    {m.topCustomer}
                                  </Card.Text>
                                </Card.Body>
                              </Card>
                            </Col>
                            <Col md={2}>
                              <Card bg="black" text="light" className="mb-2">
                                <Card.Body className="p-2">
                                  <Card.Title className="fs-6">
                                    Média/hora
                                  </Card.Title>
                                  <Card.Text className="fs-5 fw-bold">
                                    {m.avgOrdersPerHour}
                                  </Card.Text>
                                </Card.Body>
                              </Card>
                            </Col>
                            <Col md={2}>
                              <Card bg="black" text="light" className="mb-2">
                                <Card.Body className="p-2">
                                  <Card.Title className="fs-6">
                                    Ticket médio
                                  </Card.Title>
                                  <Card.Text className="fs-5 fw-bold">
                                    R{String.fromCharCode(36)}
                                    {(m.avgTicket || "0.00").replace(".", ",")}
                                  </Card.Text>
                                </Card.Body>
                              </Card>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      </Container>
    </div>
  );
}
